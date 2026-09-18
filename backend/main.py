import logging
from backend import logging_config
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


from backend import auth, models, schemas
from backend.database import SessionLocal, engine, Base, get_db

app = FastAPI(title="Employee Management System")
logger = logging.getLogger(__name__)
# ---------------------------------------------------------------------------
# CORS - allow the React dev server (and any origin while developing) to
# call this API. Tighten allow_origins before deploying.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# Global error handling - turn raw exceptions into clean JSON responses
# instead of leaking stack traces or returning bare {"message": ...} bodies.
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(p) for p in e["loc"] if p != "body"), "message": e["msg"]}
        for e in exc.errors()
    ]
    logger.warning(f"Validation error on {request.method} {request.url.path}: {errors}")
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(SQLAlchemyError)
async def db_exception_handler(request, exc: SQLAlchemyError):
    logger.error(f"Database error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred. Please try again."},
    )


@app.get("/")
def home():
    logger.debug("Root endpoint hit")
    return {"message": "Employee Management System API"}
# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Signup attempt: {user.email}")
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        logger.warning(f"Signup failed, email already registered: {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=auth.hash_password(user.password),
        role=models.UserRole.user,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.info(f"User signed up successfully: id={new_user.id}, email={new_user.email}")
    return new_user


@app.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Login attempt: {credentials.email}")
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not auth.verify_password(credentials.password, user.password):
        logger.warning(f"Login failed: {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = auth.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    logger.info(f"Login successful: id={user.id}, role={user.role.value}")
    return schemas.Token(access_token=access_token, user=user)


@app.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(auth.get_current_user)):
    logger.debug(f"User id={current_user.id} fetched their own profile")
    return current_user

# ---------------------------------------------------------------------------
# User management - super_admin only
# ---------------------------------------------------------------------------

@app.get("/users", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(auth.require_roles(models.UserRole.super_admin)),
):
    return db.query(models.User).all()


@app.patch("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(models.UserRole.super_admin)),
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if target_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)
    return target_user


@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(models.UserRole.super_admin)),
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if target_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    db.delete(target_user)
    db.commit()
    return {"message": "User deleted successfully"}

# ---------------------------------------------------------------------------
# Employees
#   - super_admin & admin: full CRUD, can see every employee
#   - user: read-only access to their own linked employee record
# ---------------------------------------------------------------------------

def _apply_user_link(employee: models.Employee, user_email: str | None, db: Session):
    if user_email is None:
        employee.user_id = None
        return
    linked_user = db.query(models.User).filter(models.User.email == user_email).first()
    if linked_user is None:
        raise HTTPException(status_code=404, detail=f"No user account found for {user_email}")
    already_linked = (
        db.query(models.Employee)
        .filter(models.Employee.user_id == linked_user.id, models.Employee.id != employee.id)
        .first()
    )
    if already_linked:
        raise HTTPException(status_code=400, detail="That user is already linked to another employee record")
    employee.user_id = linked_user.id


@app.post(
    "/employees",
    response_model=schemas.EmployeeOut,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(
        auth.require_roles(models.UserRole.super_admin, models.UserRole.admin)
    ),
):
    logger.info(f"Attempting to create employee: {employee.email}")
    if db.query(models.Employee).filter(models.Employee.email == employee.email).first():
        logger.warning(f"Create failed, email already exists: {employee.email}")
        raise HTTPException(status_code=400, detail="An employee with this email already exists")

    new_employee = models.Employee(
        name=employee.name,
        email=employee.email,
        department=employee.department,
        salary=employee.salary,
    )
    _apply_user_link(new_employee, employee.user_email, db)

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    logger.info(f"Employee created successfully: id={new_employee.id}")
    return new_employee


from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

@app.get("/employees", response_model=list[schemas.EmployeeOut])
def get_employees(
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(
        auth.require_roles(models.UserRole.super_admin, models.UserRole.admin)
    ),
):
    logger.debug("Fetching all employees")
    try:
        employees = db.query(models.Employee).all()
        logger.info(f"Fetched {len(employees)} employees")
        return employees
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_employees: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred") from e
    except Exception as e:
        logger.error(f"Unexpected error in get_employees: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong") from e


@app.get("/employees/me", response_model=schemas.EmployeeOut)
def get_my_employee_record(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(models.UserRole.user)),
):
    logger.debug(f"User id={current_user.id} fetching their own employee record")
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if employee is None:
        logger.warning(f"No employee record linked to user id={current_user.id}")
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to your account yet. Ask an admin to link it.",
        )
    logger.info(f"Employee record fetched for user id={current_user.id}: employee id={employee.id}")
    return employee


@app.get("/employees/{employee_id}", response_model=schemas.EmployeeOut)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    logger.debug(f"Fetching employee id={employee_id}, requested by user id={current_user.id}")
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if employee is None:
        logger.warning(f"Employee not found: id={employee_id}")
        raise HTTPException(status_code=404, detail="Employee not found")

    if current_user.role == models.UserRole.user and employee.user_id != current_user.id:
        logger.warning(
            f"Access denied: user id={current_user.id} tried to view employee id={employee_id}"
        )
        raise HTTPException(status_code=403, detail="You can only view your own employee record")

    logger.info(f"Employee fetched: id={employee_id}")
    return employee


@app.put("/employees/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(
    employee_id: int,
    employee: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(
        auth.require_roles(models.UserRole.super_admin, models.UserRole.admin)
    ),
):
    logger.info(f"Attempting to update employee id={employee_id}")
    existing_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if existing_employee is None:
        logger.warning(f"Update failed, employee not found: id={employee_id}")
        raise HTTPException(status_code=404, detail="Employee not found")

    duplicate = (
        db.query(models.Employee)
        .filter(models.Employee.email == employee.email, models.Employee.id != employee_id)
        .first()
    )
    if duplicate:
        logger.warning(f"Update failed, duplicate email: {employee.email}")
        raise HTTPException(status_code=400, detail="Another employee already uses this email")

    existing_employee.name = employee.name
    existing_employee.email = employee.email
    existing_employee.department = employee.department
    existing_employee.salary = employee.salary
    _apply_user_link(existing_employee, employee.user_email, db)

    db.commit()
    db.refresh(existing_employee)
    logger.info(f"Employee updated successfully: id={employee_id}")
    return existing_employee


@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: models.User = Depends(
        auth.require_roles(models.UserRole.super_admin, models.UserRole.admin)
    ),
):
    logger.info(f"Attempting to delete employee id={employee_id}")
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if employee is None:
        logger.warning(f"Delete failed, employee not found: id={employee_id}")
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()
    logger.info(f"Employee deleted successfully: id={employee_id}")
    return {"message": "Employee deleted successfully"}
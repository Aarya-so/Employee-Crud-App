# Employee Management System

FastAPI backend + React frontend, with three permission levels: **Super Admin**,
**Admin**, and **User**.

## What changed from the original version

- **Role-based access control** using JWT tokens (`python-jose`), not just a
  plain login check. Every protected endpoint checks the caller's role.
- **Field-level validation** on every input (name, email, department, salary,
  password) using Pydantic validators, with specific error messages returned
  per field instead of a generic message.
- **Proper error handling**: 401 (not logged in), 403 (wrong role), 404 (not
  found), 400 (bad request, e.g. duplicate email), 422 (validation) — instead
  of returning `{"message": "..."}` with a 200 status for failures.
- **React frontend** (Vite) replacing the static HTML/JS pages, with
  role-aware routing and navigation.

## Roles and permissions

| Role | Can do |
|---|---|
| **Super Admin** | Everything Admin can do, plus: view all user accounts, change any user's role, delete user accounts |
| **Admin** | Full CRUD on employee records (create, view all, edit, delete) |
| **User** | View only their *own* linked employee record (read-only) |

New signups always start as `user`. A Super Admin promotes accounts to
`admin` or `super_admin` from the **Users & roles** page. There's no
Super Admin by default — see "Creating the first Super Admin" below.

### How a "User" account sees "their own" data

An `Employee` record has an optional `user_id` linking it to a login
account. When an Admin or Super Admin creates/edits an employee, they can
optionally enter the person's account email in "Link to a login account" —
that's what lets that person see their record under **My record**. This
was a design decision to bridge "login accounts" and "employee records",
since the original app treated them as unrelated tables.

## Running the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

By default it connects to MSSQL exactly like the original project
(`employeedata` DB, Windows trusted connection, ODBC Driver 18). To test
quickly without MSSQL set up, override with SQLite:

```bash
export DATABASE_URL="sqlite:///./employees.db"   # optional, for local testing
export SECRET_KEY="change-me-to-something-random"
uvicorn backend.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs at `/docs`.

**Important:** set `SECRET_KEY` to a real random value before this goes
anywhere beyond your own machine — it signs the login tokens.

### Creating the first Super Admin

Since every signup starts as `user`, promote your own account once via
the database directly the first time:

```bash
python -c "
from backend.database import SessionLocal
from backend import models
db = SessionLocal()
u = db.query(models.User).filter(models.User.email=='YOUR_EMAIL').first()
u.role = models.UserRole.super_admin
db.commit()
"
```

After that, use the **Users & roles** page in the app to promote anyone else.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://127.0.0.1:5173` and talks to the backend at
`http://127.0.0.1:8000` by default. To point it elsewhere, create a
`.env` file in `frontend/` with:

```
VITE_API_URL=http://127.0.0.1:8000
```

## Notes for the mentor review

- Passwords are hashed with `pwdlib` (Argon2), never stored in plain text.
- Tokens expire after 8 hours.
- All employee fields are validated server-side (not just in the browser),
  since client-side validation alone can always be bypassed.
- The old static `frontend/` folder (plain HTML/JS) has been replaced —
  everything now lives in the new `frontend/` React app.

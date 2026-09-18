import re
from decimal import Decimal
from typing import Optional
import logging
logger = logging.getLogger(__name__)
from pydantic import BaseModel, EmailStr, Field, field_validator

from backend.models import UserRole

NAME_RE = re.compile(r"^[A-Za-z][A-Za-z\s.'-]{1,99}$")


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    department: str = Field(..., min_length=2, max_length=100)
    salary: Decimal = Field(..., gt=0, le=100_000_000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not NAME_RE.match(v):
            raise ValueError(
                "Name must be 2-100 letters and may include spaces, "
                "apostrophes or hyphens only"
            )
        return v

    @field_validator("department")
    @classmethod
    def validate_department(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Department must be at least 2 characters")
        return v


class EmployeeCreate(EmployeeBase):
    # Optional: link this employee record to an existing "user"-role account
    # (by email) so that account can view its own data via GET /employees/me
    user_email: Optional[EmailStr] = None


class EmployeeUpdate(EmployeeBase):
    user_email: Optional[EmailStr] = None


class EmployeeOut(EmployeeBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Auth / Users
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not NAME_RE.match(v):
            raise ValueError(
                "Name must be 2-100 letters and may include spaces, "
                "apostrophes or hyphens only"
            )
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

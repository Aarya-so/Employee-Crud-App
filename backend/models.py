import enum

from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from backend.database import Base


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user)

    # A "user"-role account is linked to their own employee record so they
    # can view (but not edit) their own data. Admin/super_admin accounts
    # typically have no linked employee record.
    employee = relationship(
        "Employee",
        back_populates="owner",
        uselist=False,
        foreign_keys="Employee.user_id",
    )


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False)
    salary = Column(Numeric(12, 2), nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    owner = relationship("User", back_populates="employee", foreign_keys=[user_id])

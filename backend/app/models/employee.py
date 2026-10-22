from datetime import date
from enum import Enum

from sqlalchemy import Date, Enum as SQLAlchemyEnum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmployeeStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    designation: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    department: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    joining_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    salary: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    status: Mapped[EmployeeStatus] = mapped_column(
        SQLAlchemyEnum(EmployeeStatus, name="employee_status"),
        default=EmployeeStatus.ACTIVE,
        nullable=False,
    )

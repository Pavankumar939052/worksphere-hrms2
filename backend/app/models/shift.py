from datetime import time

from sqlalchemy import ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Shift(Base):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    name: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    start_time: Mapped[time] = mapped_column(
        Time, nullable=False
    )
    end_time: Mapped[time] = mapped_column(
        Time, nullable=False
    )


class EmployeeShift(Base):
    __tablename__ = "employee_shifts"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            name="uq_employee_shift_employee",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )
    shift_id: Mapped[int] = mapped_column(
        ForeignKey("shifts.id"), nullable=False, index=True
    )

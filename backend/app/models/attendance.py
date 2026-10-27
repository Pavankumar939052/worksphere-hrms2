from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SQLAlchemyEnum,
    Float,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"


class Attendance(Base):
    __tablename__ = "attendance"

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "date",
            name="uq_attendance_employee_date",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )
    check_in: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    check_out: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    date: Mapped[date] = mapped_column(
        Date, nullable=False, index=True
    )
    status: Mapped[AttendanceStatus] = mapped_column(
        SQLAlchemyEnum(AttendanceStatus, name="attendance_status"),
        default=AttendanceStatus.PRESENT,
        nullable=False,
    )
    is_late: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_early_checkout: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    overtime_hours: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )

    @property
    def working_hours(self) -> float | None:
        if self.check_in is None or self.check_out is None:
            return None

        start = self.check_in
        end = self.check_out

        if start.tzinfo is not None:
            start = start.replace(tzinfo=None)
        if end.tzinfo is not None:
            end = end.replace(tzinfo=None)

        duration = (end - start).total_seconds() / 3600
        return round(max(0, duration), 2)

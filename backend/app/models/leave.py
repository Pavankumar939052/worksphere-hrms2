from datetime import date
from enum import Enum

from sqlalchemy import (
    Date,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LeaveType(str, Enum):
    SICK = "SICK"
    CASUAL = "CASUAL"
    PAID = "PAID"


class LeaveStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Leave(Base):
    __tablename__ = "leaves"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(
        SQLAlchemyEnum(LeaveType, name="leave_type"),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    end_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    reason: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    status: Mapped[LeaveStatus] = mapped_column(
        SQLAlchemyEnum(LeaveStatus, name="leave_status"),
        default=LeaveStatus.PENDING,
        nullable=False,
    )

from sqlalchemy import (
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.leave import LeaveType


class LeavePolicy(Base):
    __tablename__ = "leave_policies"
    __table_args__ = (
        UniqueConstraint("leave_type", name="uq_leave_policy_type"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    leave_type: Mapped[LeaveType] = mapped_column(
        SQLAlchemyEnum(LeaveType, name="leave_policy_type"),
        nullable=False,
    )
    total_days_allowed: Mapped[int] = mapped_column(
        Integer, nullable=False
    )


class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "leave_type",
            name="uq_employee_leave_balance",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    leave_type: Mapped[LeaveType] = mapped_column(
        SQLAlchemyEnum(LeaveType, name="leave_balance_type"),
        nullable=False,
    )
    remaining_days: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

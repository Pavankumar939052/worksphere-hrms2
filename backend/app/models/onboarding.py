from datetime import date
from enum import Enum

from sqlalchemy import Date, Enum as SQLAlchemyEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OnboardingStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"


class Onboarding(Base):
    __tablename__ = "onboarding"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )
    task_name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    status: Mapped[OnboardingStatus] = mapped_column(
        SQLAlchemyEnum(OnboardingStatus, name="onboarding_status"),
        default=OnboardingStatus.PENDING,
        nullable=False,
    )
    due_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )

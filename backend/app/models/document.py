from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )
    original_filename: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    stored_filename: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    document_type: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    expiry_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )

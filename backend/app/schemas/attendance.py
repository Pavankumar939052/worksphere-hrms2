from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.attendance import AttendanceStatus


class AttendanceCheckIn(BaseModel):
    employee_id: int


class AttendanceCheckOut(BaseModel):
    employee_id: int


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: datetime | None
    check_out: datetime | None
    status: AttendanceStatus
    working_hours: float | None
    is_late: bool
    is_early_checkout: bool
    overtime_hours: float

    model_config = ConfigDict(from_attributes=True)

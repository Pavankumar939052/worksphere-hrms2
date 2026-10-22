from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.employee import EmployeeStatus


class EmployeeCreate(BaseModel):
    user_id: int = Field(gt=0)
    full_name: str = Field(min_length=2, max_length=100)
    designation: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=100)
    joining_date: date
    salary: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    status: EmployeeStatus = EmployeeStatus.ACTIVE


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    designation: str | None = Field(default=None, min_length=2, max_length=100)
    department: str | None = Field(default=None, min_length=2, max_length=100)
    joining_date: date | None = None
    salary: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    status: EmployeeStatus | None = None


class EmployeeResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    designation: str
    department: str
    joining_date: date
    salary: Decimal
    status: EmployeeStatus

    model_config = ConfigDict(from_attributes=True)

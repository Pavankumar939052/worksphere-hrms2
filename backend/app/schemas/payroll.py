from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PayrollCreate(BaseModel):
    employee_id: int = Field(gt=0)
    basic_salary: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    deductions: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)
    bonus: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")

    @field_validator("basic_salary", "deductions", "bonus")
    @classmethod
    def validate_money(cls, value: Decimal) -> Decimal:
        if not value.is_finite():
            raise ValueError("Amount must be a finite number")
        return value


class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    basic_salary: Decimal
    deductions: Decimal
    bonus: Decimal
    net_salary: Decimal
    month: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict, Field

from app.models.leave import LeaveType


class LeavePolicyCreate(BaseModel):
    leave_type: LeaveType
    total_days_allowed: int = Field(ge=0, le=365)


class LeavePolicyResponse(BaseModel):
    id: int
    leave_type: LeaveType
    total_days_allowed: int

    model_config = ConfigDict(from_attributes=True)


class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    remaining_days: int = Field(ge=0)

    model_config = ConfigDict(from_attributes=True)

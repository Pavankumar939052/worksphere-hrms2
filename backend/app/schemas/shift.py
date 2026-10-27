from datetime import time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ShiftCreate(BaseModel):
    name: str = Field(min_length=1, max_length=30)
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_shift_times(self):
        if self.start_time == self.end_time:
            raise ValueError("Shift start and end times cannot be identical")
        return self


class ShiftResponse(BaseModel):
    id: int
    name: str
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)


class EmployeeShiftCreate(BaseModel):
    employee_id: int = Field(gt=0)
    shift_id: int = Field(gt=0)


class EmployeeShiftResponse(BaseModel):
    id: int
    employee_id: int
    shift_id: int

    model_config = ConfigDict(from_attributes=True)

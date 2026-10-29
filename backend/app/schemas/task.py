from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    employee_id: int = Field(gt=0)
    due_date: date | None = None


class TaskStatusUpdate(BaseModel):
    status: Literal["PENDING", "IN_PROGRESS", "COMPLETED"]


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    employee_id: int
    assigned_by: int
    due_date: date | None
    status: str

    model_config = ConfigDict(from_attributes=True)

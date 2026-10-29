from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.feedback import FeedbackStatus


class FeedbackCreate(BaseModel):
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=5, max_length=5000)


class FeedbackStatusUpdate(BaseModel):
    status: FeedbackStatus


class FeedbackResponse(BaseModel):
    id: int
    employee_id: int
    subject: str
    message: str
    status: FeedbackStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

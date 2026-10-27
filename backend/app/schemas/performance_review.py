from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PerformanceReviewCreate(BaseModel):
    employee_id: int = Field(gt=0)
    review_period_start: date
    review_period_end: date
    rating: int = Field(ge=1, le=5)
    strengths: str = Field(min_length=2, max_length=5000)
    areas_for_improvement: str = Field(min_length=2, max_length=5000)
    comments: str = Field(default="", max_length=5000)

    @model_validator(mode="after")
    def validate_review_period(self):
        if self.review_period_end < self.review_period_start:
            raise ValueError("Review period end must be on or after the start date")
        return self


class PerformanceReviewUpdate(BaseModel):
    review_period_start: date | None = None
    review_period_end: date | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    strengths: str | None = Field(default=None, min_length=2, max_length=5000)
    areas_for_improvement: str | None = Field(default=None, min_length=2, max_length=5000)
    comments: str | None = Field(default=None, max_length=5000)
    status: Literal["DRAFT", "PUBLISHED"] | None = None


class PerformanceReviewResponse(BaseModel):
    id: int
    employee_id: int
    reviewer_id: int
    review_period_start: date
    review_period_end: date
    rating: int
    strengths: str
    areas_for_improvement: str
    comments: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

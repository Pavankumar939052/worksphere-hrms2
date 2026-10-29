from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=10000)
    expires_at: datetime | None = None

    @model_validator(mode="after")
    def validate_content(self):
        if not self.title.strip():
            raise ValueError("Announcement title cannot be empty")
        if not self.message.strip():
            raise ValueError("Announcement message cannot be empty")
        return self


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    message: str | None = Field(default=None, min_length=1, max_length=10000)
    expires_at: datetime | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_content(self):
        if self.title is not None and not self.title.strip():
            raise ValueError("Announcement title cannot be empty")
        if self.message is not None and not self.message.strip():
            raise ValueError("Announcement message cannot be empty")
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update")
        return self


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    author_id: int
    is_active: bool
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

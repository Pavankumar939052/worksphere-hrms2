from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class NotificationPreferencesUpdate(BaseModel):
    email_notifications: bool = True
    in_app_notifications: bool = True


class NotificationPreferencesResponse(BaseModel):
    id: int
    user_id: int
    email_notifications: bool
    in_app_notifications: bool

    model_config = ConfigDict(from_attributes=True)

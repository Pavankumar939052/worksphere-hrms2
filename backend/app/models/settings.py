from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class NotificationPreferences(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    email_notifications: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    in_app_notifications: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

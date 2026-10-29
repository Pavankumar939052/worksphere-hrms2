from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.models.settings import NotificationPreferences
from app.models.user import User
from app.schemas.settings import (
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    PasswordChange,
    ProfileUpdate,
)

router = APIRouter(prefix="/settings", tags=["Profile & Settings"])


@router.patch("/profile")
def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = profile_data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one profile field to update",
        )

    if "username" in updates and updates["username"] is not None:
        updates["username"] = updates["username"].strip()
        if not updates["username"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Username cannot be empty",
            )

    if "email" in updates and updates["email"] is not None:
        updates["email"] = str(updates["email"]).lower().strip()

    conditions = []
    if updates.get("username") is not None:
        conditions.append(User.username == updates["username"])
    if updates.get("email") is not None:
        conditions.append(User.email == updates["email"])

    if conditions:
        duplicate = db.query(User).filter(
            User.id != current_user.id,
            or_(*conditions),
        ).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email is already in use",
            )

    for field, value in updates.items():
        if value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(
        password_data.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must differ from the current password",
        )

    current_user.hashed_password = hash_password(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get(
    "/notifications",
    response_model=NotificationPreferencesResponse,
)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferences = db.query(NotificationPreferences).filter(
        NotificationPreferences.user_id == current_user.id
    ).first()

    if preferences is None:
        preferences = NotificationPreferences(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


@router.put(
    "/notifications",
    response_model=NotificationPreferencesResponse,
)
def update_notification_preferences(
    preferences_data: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferences = db.query(NotificationPreferences).filter(
        NotificationPreferences.user_id == current_user.id
    ).first()

    if preferences is None:
        preferences = NotificationPreferences(user_id=current_user.id)
        db.add(preferences)

    preferences.email_notifications = preferences_data.email_notifications
    preferences.in_app_notifications = preferences_data.in_app_notifications

    db.commit()
    db.refresh(preferences)

    return preferences

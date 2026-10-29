from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.announcement import Announcement
from app.models.user import User, UserRole
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementUpdate,
)

router = APIRouter(prefix="/announcements", tags=["Internal Announcements"])


def is_expired(announcement: Announcement) -> bool:
    if announcement.expires_at is None:
        return False

    expiry = announcement.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    return expiry <= datetime.now(timezone.utc)


@router.post(
    "/",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(
    announcement_data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    announcement = Announcement(
        title=announcement_data.title.strip(),
        message=announcement_data.message.strip(),
        author_id=current_user.id,
        expires_at=announcement_data.expires_at,
        is_active=True,
    )
    db.add(announcement)
    try:
        db.commit()
        db.refresh(announcement)
    except Exception:
        db.rollback()
        raise

    return announcement


@router.get("/", response_model=list[AnnouncementResponse])
def list_announcements(
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Announcement)

    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        query = query.filter(Announcement.is_active.is_(True))

    elif not include_inactive:
        query = query.filter(Announcement.is_active.is_(True))

    announcements = query.order_by(
        Announcement.created_at.desc(),
        Announcement.id.desc(),
    ).all()

    if current_user.role in (UserRole.HR, UserRole.ADMIN):
        return announcements

    return [item for item in announcements if not is_expired(item)]


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if announcement is None:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        if not announcement.is_active or is_expired(announcement):
            raise HTTPException(
                status_code=404,
                detail="Announcement not found",
            )

    return announcement


@router.patch("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if announcement is None:
        raise HTTPException(status_code=404, detail="Announcement not found")

    updates = announcement_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(announcement, field, value.strip() if field in ("title", "message") and value is not None else value)

    announcement.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(announcement)
    except Exception:
        db.rollback()
        raise

    return announcement


@router.delete("/{announcement_id}", response_model=AnnouncementResponse)
def deactivate_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if announcement is None:
        raise HTTPException(status_code=404, detail="Announcement not found")

    announcement.is_active = False
    announcement.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(announcement)
    except Exception:
        db.rollback()
        raise

    return announcement

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.resignation import Resignation, ResignationStatus
from app.models.user import User, UserRole
from app.schemas.resignation import (
    ResignationCreate,
    ResignationResponse,
    ResignationReview,
)

router = APIRouter(prefix="/resignations", tags=["Resignation & Exit Management"])


def get_employee(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


@router.post("/", response_model=ResignationResponse, status_code=201)
def submit_resignation(
    resignation_data: ResignationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user.id)

    reason = resignation_data.reason.strip()
    if len(reason) < 5:
        raise HTTPException(
            status_code=422,
            detail="Resignation reason must contain at least 5 non-space characters",
        )

    resignation = Resignation(
        employee_id=employee.id,
        reason=reason,
        notice_period=resignation_data.notice_period,
        status=ResignationStatus.PENDING,
    )
    db.add(resignation)

    try:
        db.commit()
        db.refresh(resignation)
    except Exception:
        db.rollback()
        raise

    return resignation


@router.get("/my-requests", response_model=list[ResignationResponse])
def get_my_resignations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user.id)

    return (
        db.query(Resignation)
        .filter(Resignation.employee_id == employee.id)
        .order_by(Resignation.created_at.desc(), Resignation.id.desc())
        .all()
    )


@router.get("/", response_model=list[ResignationResponse])
def list_resignations(
    status_filter: ResignationStatus | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    query = db.query(Resignation)

    if status_filter is not None:
        query = query.filter(Resignation.status == status_filter)

    return (
        query.order_by(Resignation.created_at.desc(), Resignation.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.patch("/{resignation_id}/review", response_model=ResignationResponse)
def review_resignation(
    resignation_id: int,
    review_data: ResignationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    resignation = (
        db.query(Resignation)
        .filter(Resignation.id == resignation_id)
        .first()
    )

    if resignation is None:
        raise HTTPException(status_code=404, detail="Resignation request not found")

    if resignation.status != ResignationStatus.PENDING:
        raise HTTPException(
            status_code=409,
            detail="This resignation request has already been reviewed",
        )

    resignation.status = ResignationStatus(review_data.status)

    try:
        db.commit()
        db.refresh(resignation)
    except Exception:
        db.rollback()
        raise

    return resignation

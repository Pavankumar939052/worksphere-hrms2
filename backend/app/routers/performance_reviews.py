from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.performance_review import PerformanceReview
from app.models.user import User, UserRole
from app.schemas.performance_review import (
    PerformanceReviewCreate,
    PerformanceReviewResponse,
    PerformanceReviewUpdate,
)

router = APIRouter(
    prefix="/performance-reviews",
    tags=["Performance Reviews"],
)


def get_employee(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


def validate_review_period(start: date, end: date) -> None:
    if end < start:
        raise HTTPException(
            status_code=422,
            detail="Review period end must be on or after the start date",
        )


@router.post("/", response_model=PerformanceReviewResponse, status_code=201)
def create_performance_review(
    review_data: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    employee = db.query(Employee).filter(
        Employee.id == review_data.employee_id
    ).first()

    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    validate_review_period(
        review_data.review_period_start,
        review_data.review_period_end,
    )

    review = PerformanceReview(
        employee_id=employee.id,
        reviewer_id=current_user.id,
        review_period_start=review_data.review_period_start,
        review_period_end=review_data.review_period_end,
        rating=review_data.rating,
        strengths=review_data.strengths.strip(),
        areas_for_improvement=review_data.areas_for_improvement.strip(),
        comments=review_data.comments.strip(),
        status="DRAFT",
    )

    if len(review.strengths) < 2 or len(review.areas_for_improvement) < 2:
        raise HTTPException(
            status_code=422,
            detail="Strengths and improvement areas must contain meaningful text",
        )

    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/", response_model=list[PerformanceReviewResponse])
def list_performance_reviews(
    employee_id: int | None = Query(default=None, gt=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PerformanceReview)

    if current_user.role in (UserRole.HR, UserRole.ADMIN):
        if employee_id is not None:
            query = query.filter(
                PerformanceReview.employee_id == employee_id
            )
    else:
        employee = get_employee(db, current_user.id)
        query = query.filter(
            PerformanceReview.employee_id == employee.id,
            PerformanceReview.status == "PUBLISHED",
        )

    return (
        query.order_by(PerformanceReview.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{review_id}", response_model=PerformanceReviewResponse)
def get_performance_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id
    ).first()

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Performance review not found",
        )

    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        employee = get_employee(db, current_user.id)
        if (
            review.employee_id != employee.id
            or review.status != "PUBLISHED"
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot access this performance review",
            )

    return review


@router.put("/{review_id}", response_model=PerformanceReviewResponse)
def update_performance_review(
    review_id: int,
    review_data: PerformanceReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id
    ).first()

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Performance review not found",
        )

    if review.status == "PUBLISHED":
        raise HTTPException(
            status_code=409,
            detail="Published reviews cannot be edited",
        )

    updates = review_data.model_dump(exclude_unset=True)

    if "status" in updates:
        raise HTTPException(
            status_code=422,
            detail="Use the publish endpoint to publish a review",
        )

    start = updates.get("review_period_start", review.review_period_start)
    end = updates.get("review_period_end", review.review_period_end)
    validate_review_period(start, end)

    for field, value in updates.items():
        if field in ("strengths", "areas_for_improvement"):
            value = value.strip()
            if len(value) < 2:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} must contain meaningful text",
                )
        elif field == "comments" and value is not None:
            value = value.strip()

        setattr(review, field, value)

    try:
        db.commit()
        db.refresh(review)
    except Exception:
        db.rollback()
        raise

    return review


@router.patch("/{review_id}/publish", response_model=PerformanceReviewResponse)
def publish_performance_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id
    ).first()

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Performance review not found",
        )

    if review.status != "DRAFT":
        raise HTTPException(
            status_code=409,
            detail="Only draft reviews can be published",
        )

    review.status = "PUBLISHED"

    try:
        db.commit()
        db.refresh(review)
    except Exception:
        db.rollback()
        raise

    return review


@router.delete("/{review_id}", status_code=204)
def delete_performance_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id
    ).first()

    if review is None:
        raise HTTPException(
            status_code=404,
            detail="Performance review not found",
        )

    if review.status == "PUBLISHED":
        raise HTTPException(
            status_code=409,
            detail="Published reviews cannot be deleted",
        )

    db.delete(review)
    db.commit()
    return None

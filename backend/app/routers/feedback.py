from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.feedback import EmployeeFeedback, FeedbackStatus
from app.models.user import User, UserRole
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackStatusUpdate,
)

router = APIRouter(prefix="/feedback", tags=["Employee Feedback"])


def get_employee_for_user(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


@router.post("/", response_model=FeedbackResponse, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user.id)

    feedback = EmployeeFeedback(
        employee_id=employee.id,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/my", response_model=list[FeedbackResponse])
def get_my_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user.id)

    return (
        db.query(EmployeeFeedback)
        .filter(EmployeeFeedback.employee_id == employee.id)
        .order_by(EmployeeFeedback.created_at.desc())
        .all()
    )


@router.get(
    "/",
    response_model=list[FeedbackResponse],
    dependencies=[Depends(require_roles(UserRole.HR, UserRole.ADMIN))],
)
def get_all_feedback(db: Session = Depends(get_db)):
    return (
        db.query(EmployeeFeedback)
        .order_by(EmployeeFeedback.created_at.desc())
        .all()
    )


@router.patch(
    "/{feedback_id}/status",
    response_model=FeedbackResponse,
    dependencies=[Depends(require_roles(UserRole.HR, UserRole.ADMIN))],
)
def update_feedback_status(
    feedback_id: int,
    payload: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
):
    feedback = (
        db.query(EmployeeFeedback)
        .filter(EmployeeFeedback.id == feedback_id)
        .first()
    )
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.status = payload.status
    db.commit()
    db.refresh(feedback)
    return feedback

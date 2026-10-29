from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.onboarding import Onboarding, OnboardingStatus
from app.models.user import User, UserRole
from app.schemas.onboarding import (
    OnboardingCreate,
    OnboardingResponse,
    OnboardingStatusUpdate,
)

router = APIRouter(prefix="/onboarding", tags=["Employee Onboarding"])


def get_employee(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


@router.post("/", response_model=OnboardingResponse, status_code=201)
def create_onboarding_task(
    task_data: OnboardingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    employee = db.query(Employee).filter(
        Employee.id == task_data.employee_id
    ).first()

    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    task_name = task_data.task_name.strip()
    if len(task_name) < 2:
        raise HTTPException(
            status_code=422,
            detail="Task name must contain meaningful text",
        )

    task = Onboarding(
        employee_id=employee.id,
        task_name=task_name,
        due_date=task_data.due_date,
        status=OnboardingStatus.PENDING,
    )
    db.add(task)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task


@router.get("/", response_model=list[OnboardingResponse])
def list_onboarding_tasks(
    employee_id: int | None = Query(default=None, gt=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    query = db.query(Onboarding)

    if employee_id is not None:
        query = query.filter(Onboarding.employee_id == employee_id)

    return (
        query.order_by(Onboarding.due_date.asc(), Onboarding.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/my-tasks", response_model=list[OnboardingResponse])
def get_my_onboarding_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user.id)

    return (
        db.query(Onboarding)
        .filter(Onboarding.employee_id == employee.id)
        .order_by(Onboarding.due_date.asc(), Onboarding.id.asc())
        .all()
    )


@router.patch("/{task_id}/status", response_model=OnboardingResponse)
def update_onboarding_status(
    task_id: int,
    status_data: OnboardingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Onboarding).filter(Onboarding.id == task_id).first()

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Onboarding task not found",
        )

    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        employee = get_employee(db, current_user.id)
        if task.employee_id != employee.id:
            raise HTTPException(
                status_code=403,
                detail="You cannot update another employee's onboarding task",
            )

    task.status = OnboardingStatus(status_data.status)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task

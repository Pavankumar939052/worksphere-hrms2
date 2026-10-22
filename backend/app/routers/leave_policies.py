from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.leave import LeaveType
from app.models.leave_policy import LeaveBalance, LeavePolicy
from app.models.user import User, UserRole
from app.schemas.leave_policy import (
    LeaveBalanceResponse,
    LeavePolicyCreate,
    LeavePolicyResponse,
)

router = APIRouter(prefix="/leave-policies", tags=["Leave Policies"])


@router.get("/", response_model=list[LeavePolicyResponse])
def list_leave_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(LeavePolicy).order_by(LeavePolicy.id).all()


@router.post(
    "/",
    response_model=LeavePolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_leave_policy(
    policy_data: LeavePolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HR)),
):
    existing = db.query(LeavePolicy).filter(
        LeavePolicy.leave_type == policy_data.leave_type
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A policy already exists for this leave type",
        )

    policy = LeavePolicy(
        leave_type=policy_data.leave_type,
        total_days_allowed=policy_data.total_days_allowed,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/balances/me", response_model=list[LeaveBalanceResponse])
def get_my_leave_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = db.query(Employee).filter(
        Employee.user_id == current_user.id
    ).first()

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for this account",
        )

    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee.id
    ).order_by(LeaveBalance.leave_type).all()


@router.get("/balances/", response_model=list[LeaveBalanceResponse])
def list_leave_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HR)),
):
    return db.query(LeaveBalance).order_by(
        LeaveBalance.employee_id,
        LeaveBalance.leave_type,
    ).all()


@router.post(
    "/balances/initialize",
    status_code=status.HTTP_200_OK,
)
def initialize_leave_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HR)),
):
    policies = db.query(LeavePolicy).all()
    employees = db.query(Employee).filter(
        Employee.status == "ACTIVE"
    ).all()

    if not policies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Create leave policies before initializing balances",
        )

    created_count = 0

    for employee in employees:
        for policy in policies:
            existing = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == employee.id,
                LeaveBalance.leave_type == policy.leave_type,
            ).first()

            if existing is None:
                db.add(
                    LeaveBalance(
                        employee_id=employee.id,
                        leave_type=policy.leave_type,
                        remaining_days=policy.total_days_allowed,
                    )
                )
                created_count += 1

    db.commit()

    return {
        "message": "Leave balances initialized successfully",
        "balances_created": created_count,
    }

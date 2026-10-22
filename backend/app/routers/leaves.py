from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.leave import Leave, LeaveStatus
from app.models.leave_policy import LeaveBalance
from app.models.user import User, UserRole
from app.schemas.leave import LeaveCreate, LeaveResponse, LeaveReview

router = APIRouter(prefix="/leaves", tags=["Leaves"])


def get_employee(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


@router.post("/", response_model=LeaveResponse, status_code=201)
def apply_for_leave(
    leave_data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user.id)

    if leave_data.end_date < leave_data.start_date:
        raise HTTPException(
            status_code=422,
            detail="End date cannot be earlier than start date",
        )

    leave_days = (leave_data.end_date - leave_data.start_date).days + 1

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee.id,
        LeaveBalance.leave_type == leave_data.leave_type,
    ).first()

    if balance is None:
        raise HTTPException(
            status_code=400,
            detail="Leave balance is not initialized for this leave type",
        )

    pending_days = 0
    pending_requests = db.query(Leave).filter(
        Leave.employee_id == employee.id,
        Leave.leave_type == leave_data.leave_type,
        Leave.status == LeaveStatus.PENDING,
    ).all()

    for request in pending_requests:
        pending_days += (request.end_date - request.start_date).days + 1

    if leave_days + pending_days > balance.remaining_days:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient leave balance. Remaining: "
                f"{balance.remaining_days} days; pending requests: "
                f"{pending_days} days."
            ),
        )

    leave = Leave(
        employee_id=employee.id,
        leave_type=leave_data.leave_type,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        reason=leave_data.reason,
        status=LeaveStatus.PENDING,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.get("/my-requests", response_model=list[LeaveResponse])
def my_leave_requests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user.id)

    return (
        db.query(Leave)
        .filter(Leave.employee_id == employee.id)
        .order_by(Leave.start_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/", response_model=list[LeaveResponse])
def list_leave_requests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    return (
        db.query(Leave)
        .order_by(Leave.start_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.patch("/{leave_id}/review", response_model=LeaveResponse)
def review_leave_request(
    leave_id: int,
    review: LeaveReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    leave = db.query(Leave).filter(Leave.id == leave_id).with_for_update().first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=409,
            detail="Only pending leave requests can be reviewed",
        )

    if review.status == LeaveStatus.PENDING:
        raise HTTPException(
            status_code=422,
            detail="Review status must be APPROVED or REJECTED",
        )

    if review.status == LeaveStatus.APPROVED:
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == leave.employee_id,
            LeaveBalance.leave_type == leave.leave_type,
        ).with_for_update().first()

        if balance is None:
            raise HTTPException(
                status_code=400,
                detail="Leave balance has not been initialized for this employee",
            )

        leave_days = (leave.end_date - leave.start_date).days + 1

        if leave_days > balance.remaining_days:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot approve: requested {leave_days} days, "
                    f"but only {balance.remaining_days} days remain."
                ),
            )

        balance.remaining_days -= leave_days

    leave.status = review.status

    try:
        db.commit()
        db.refresh(leave)
    except Exception:
        db.rollback()
        raise

    return leave

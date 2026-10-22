from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.database import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee, EmployeeStatus
from app.models.leave import Leave, LeaveStatus
from app.models.payroll import Payroll
from app.models.user import User, UserRole

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    today = date.today()

    total_employees = db.query(Employee).count()
    active_employees = (
        db.query(Employee)
        .filter(Employee.status == EmployeeStatus.ACTIVE)
        .count()
    )
    present_today = (
        db.query(Attendance)
        .filter(
            Attendance.date == today,
            Attendance.check_in.isnot(None),
        )
        .count()
    )
    pending_leaves = (
        db.query(Leave)
        .filter(Leave.status == LeaveStatus.PENDING)
        .count()
    )
    total_payroll_records = db.query(Payroll).count()

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "present_today": present_today,
        "pending_leaves": pending_leaves,
        "total_payroll_records": total_payroll_records,
    }

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee, EmployeeStatus
from app.models.user import User, UserRole
from app.schemas.attendance import AttendanceResponse

router = APIRouter(prefix="/attendance", tags=["Attendance"])

SCHEDULED_START = time(9, 30)
STANDARD_WORKDAY_HOURS = 8.0


def get_employee_for_user(db: Session, user_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


def get_server_local_now() -> datetime:
    return datetime.now().astimezone()


def calculate_working_hours(record: Attendance) -> float | None:
    if record.check_in is None or record.check_out is None:
        return None

    start = record.check_in
    end = record.check_out

    if start.tzinfo is not None:
        start = start.replace(tzinfo=None)
    if end.tzinfo is not None:
        end = end.replace(tzinfo=None)

    return round(max(0.0, (end - start).total_seconds() / 3600), 2)


@router.post("/check-in", response_model=AttendanceResponse, status_code=201)
def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user.id)
    now = get_server_local_now()
    today = now.date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today,
    ).first()

    if record:
        raise HTTPException(
            status_code=409,
            detail="Attendance has already been recorded for today",
        )

    record = Attendance(
        employee_id=employee.id,
        date=today,
        check_in=now,
        status=AttendanceStatus.PRESENT,
        is_late=now.time().replace(tzinfo=None) > SCHEDULED_START,
        overtime_hours=0.0,
    )
    db.add(record)

    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Attendance has already been recorded for today",
        )

    return record


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user.id)
    today = get_server_local_now().date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today,
    ).first()

    if not record or record.check_in is None:
        raise HTTPException(
            status_code=404,
            detail="Please check in before checking out",
        )

    if record.check_out is not None:
        raise HTTPException(
            status_code=409,
            detail="You have already checked out today",
        )

    record.check_out = get_server_local_now()
    hours = calculate_working_hours(record)
    record.overtime_hours = round(
        max(0.0, (hours or 0.0) - STANDARD_WORKDAY_HOURS), 2
    )

    try:
        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save check-out. Please try again.",
        )

    return record


@router.post("/mark-absent")
def mark_absent(
    attendance_date: date = Query(default_factory=date.today, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    today = get_server_local_now().date()

    if attendance_date > today:
        raise HTTPException(
            status_code=422,
            detail="Attendance cannot be marked absent for a future date",
        )

    active_employees = db.query(Employee).filter(
        Employee.status == EmployeeStatus.ACTIVE
    ).all()

    created_count = 0
    skipped_count = 0

    try:
        for employee in active_employees:
            existing = db.query(Attendance.id).filter(
                Attendance.employee_id == employee.id,
                Attendance.date == attendance_date,
            ).first()

            if existing:
                skipped_count += 1
                continue

            db.add(
                Attendance(
                    employee_id=employee.id,
                    date=attendance_date,
                    status=AttendanceStatus.ABSENT,
                    is_late=False,
                    overtime_hours=0.0,
                )
            )
            created_count += 1

        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to mark absences. No changes were committed.",
        )

    return {
        "message": "Absence marking completed",
        "date": attendance_date.isoformat(),
        "absent_records_created": created_count,
        "existing_records_skipped": skipped_count,
    }


@router.get("/my-history", response_model=list[AttendanceResponse])
def my_attendance_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user.id)

    return (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee.id)
        .order_by(Attendance.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/", response_model=list[AttendanceResponse])
def list_attendance(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    return (
        db.query(Attendance)
        .order_by(Attendance.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

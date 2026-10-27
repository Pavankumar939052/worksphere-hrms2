from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee, EmployeeStatus
from app.models.shift import EmployeeShift, Shift
from app.models.user import User, UserRole
from app.schemas.shift import (
    EmployeeShiftCreate,
    EmployeeShiftResponse,
    ShiftCreate,
    ShiftResponse,
)

router = APIRouter(prefix="/shifts", tags=["Shift Management"])

HR_ROLES = (UserRole.HR, UserRole.ADMIN)


@router.post("/", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(
    payload: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*HR_ROLES)),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Shift name cannot be empty")

    existing = db.query(Shift).filter(Shift.name == name).first()
    if existing:
        raise HTTPException(status_code=409, detail="A shift with this name already exists")

    shift = Shift(
        name=name,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(shift)

    try:
        db.commit()
        db.refresh(shift)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Shift name already exists")

    return shift


@router.get("/", response_model=list[ShiftResponse])
def list_shifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*HR_ROLES)),
):
    return db.query(Shift).order_by(Shift.start_time, Shift.name).all()


@router.post(
    "/assign",
    response_model=EmployeeShiftResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_shift(
    payload: EmployeeShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*HR_ROLES)),
):
    employee = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.status == EmployeeStatus.ACTIVE,
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Active employee not found")

    shift = db.query(Shift).filter(Shift.id == payload.shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    assignment = db.query(EmployeeShift).filter(
        EmployeeShift.employee_id == payload.employee_id
    ).first()

    if assignment:
        assignment.shift_id = payload.shift_id
    else:
        assignment = EmployeeShift(
            employee_id=payload.employee_id,
            shift_id=payload.shift_id,
        )
        db.add(assignment)

    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Unable to save shift assignment")

    return assignment


@router.get("/assignments", response_model=list[EmployeeShiftResponse])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*HR_ROLES)),
):
    return db.query(EmployeeShift).order_by(EmployeeShift.employee_id).all()

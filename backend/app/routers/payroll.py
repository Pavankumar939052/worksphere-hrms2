from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.payroll import Payroll
from app.models.user import User, UserRole
from app.schemas.payroll import PayrollCreate, PayrollResponse

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.post("/", response_model=PayrollResponse, status_code=201)
def create_payroll(
    payroll_data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == payroll_data.employee_id)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = (
        db.query(Payroll)
        .filter(
            Payroll.employee_id == payroll_data.employee_id,
            Payroll.month == payroll_data.month,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Payroll already exists for this employee and month",
        )

    net_salary = (
        payroll_data.basic_salary
        + payroll_data.bonus
        - payroll_data.deductions
    )

    if net_salary < Decimal("0.00"):
        raise HTTPException(
            status_code=422,
            detail="Deductions cannot exceed basic salary plus bonus",
        )

    payroll = Payroll(
        employee_id=payroll_data.employee_id,
        basic_salary=payroll_data.basic_salary,
        deductions=payroll_data.deductions,
        bonus=payroll_data.bonus,
        net_salary=net_salary,
        month=payroll_data.month,
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    return payroll


@router.get("/my-history", response_model=list[PayrollResponse])
def my_payroll_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == current_user.id)
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )

    return (
        db.query(Payroll)
        .filter(Payroll.employee_id == employee.id)
        .order_by(Payroll.month.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/", response_model=list[PayrollResponse])
def list_payroll(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    return (
        db.query(Payroll)
        .order_by(Payroll.month.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

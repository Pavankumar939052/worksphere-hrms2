from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import and_
from app.models.user import UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.performance_review import PerformanceReview

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeUpdate

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.post(
    "/",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    linked_user = db.query(User).filter(User.id == employee_data.user_id).first()
    if not linked_user:
        raise HTTPException(status_code=404, detail="Linked user not found")

    existing_employee = (
        db.query(Employee)
        .filter(Employee.user_id == employee_data.user_id)
        .first()
    )
    if existing_employee:
        raise HTTPException(
            status_code=409,
            detail="An employee record already exists for this user",
        )

    employee = Employee(**employee_data.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/", response_model=list[EmployeeResponse])
def list_employees(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    return db.query(Employee).offset(skip).limit(limit).all()


@router.get("/{employee_id:int}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if (
        current_user.role not in (UserRole.HR, UserRole.ADMIN)
        and employee.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this employee",
        )

    return employee


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    updates = employee_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()
    return None


@router.get("/search", response_model=list[EmployeeResponse])
def search_employees(
    name: str | None = Query(default=None, min_length=1, max_length=150),
    department: str | None = Query(default=None, min_length=1, max_length=100),
    role: UserRole | None = Query(default=None),
    employee_status: str | None = Query(default=None, alias="status", pattern="^(ACTIVE|INACTIVE)$"),
    attendance_status: AttendanceStatus | None = Query(default=None),
    performance_rating: int | None = Query(default=None, ge=1, le=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.HR, UserRole.ADMIN)),
):
    query = db.query(Employee).join(User, Employee.user_id == User.id)

    if name:
        query = query.filter(Employee.full_name.ilike(f"%{name.strip()}%"))

    if department:
        query = query.filter(Employee.department.ilike(f"%{department.strip()}%"))

    if role:
        query = query.filter(User.role == role)

    if employee_status:
        query = query.filter(Employee.status == employee_status)

    if attendance_status:
        latest_attendance = (
            db.query(
                Attendance.employee_id,
                func.max(Attendance.date).label("latest_date"),
            )
            .group_by(Attendance.employee_id)
            .subquery()
        )
        query = (
            query.join(
                latest_attendance,
                latest_attendance.c.employee_id == Employee.id,
            )
            .join(
                Attendance,
                and_(
                    Attendance.employee_id == latest_attendance.c.employee_id,
                    Attendance.date == latest_attendance.c.latest_date,
                ),
            )
            .filter(Attendance.status == attendance_status)
        )

    if performance_rating is not None:
        latest_reviews = (
            db.query(
                PerformanceReview.employee_id,
                func.max(PerformanceReview.created_at).label("latest_created_at"),
            )
            .filter(PerformanceReview.status == "PUBLISHED")
            .group_by(PerformanceReview.employee_id)
            .subquery()
        )
        query = (
            query.join(
                latest_reviews,
                latest_reviews.c.employee_id == Employee.id,
            )
            .join(
                PerformanceReview,
                and_(
                    PerformanceReview.employee_id == latest_reviews.c.employee_id,
                    PerformanceReview.created_at == latest_reviews.c.latest_created_at,
                    PerformanceReview.status == "PUBLISHED",
                ),
            )
            .filter(PerformanceReview.rating == performance_rating)
        )

    return query.order_by(Employee.full_name.asc()).all()

from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
import csv
import io
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.database import get_db
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee, EmployeeStatus
from app.models.leave import Leave, LeaveStatus
from app.models.payroll import Payroll
from app.models.performance_review import PerformanceReview
from app.models.user import User, UserRole

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics and Reports"],
)


@router.get("/overview")
def analytics_overview(
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
    inactive_employees = total_employees - active_employees

    attendance_today = {
        status.value: db.query(Attendance)
        .filter(
            Attendance.date == today,
            Attendance.status == status,
        )
        .count()
        for status in AttendanceStatus
    }

    leave_statistics = {
        status.value: db.query(Leave)
        .filter(Leave.status == status)
        .count()
        for status in LeaveStatus
    }

    payroll_summary = db.query(
        func.count(Payroll.id),
        func.coalesce(func.sum(Payroll.basic_salary), 0),
        func.coalesce(func.sum(Payroll.deductions), 0),
        func.coalesce(func.sum(Payroll.bonus), 0),
        func.coalesce(func.sum(Payroll.net_salary), 0),
    ).first()

    review_statistics = {
        "total": db.query(PerformanceReview).count(),
        "published": db.query(PerformanceReview)
        .filter(PerformanceReview.status == "PUBLISHED")
        .count(),
        "draft": db.query(PerformanceReview)
        .filter(PerformanceReview.status == "DRAFT")
        .count(),
        "average_rating": db.query(
            func.avg(PerformanceReview.rating)
        )
        .filter(PerformanceReview.status == "PUBLISHED")
        .scalar(),
    }

    return {
        "as_of_date": today.isoformat(),
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "inactive": inactive_employees,
        },
        "attendance_today": attendance_today,
        "leaves": leave_statistics,
        "payroll": {
            "record_count": payroll_summary[0],
            "total_basic_salary": float(payroll_summary[1]),
            "total_deductions": float(payroll_summary[2]),
            "total_bonus": float(payroll_summary[3]),
            "total_net_salary": float(payroll_summary[4]),
        },
        "performance_reviews": {
            **review_statistics,
            "average_rating": (
                round(float(review_statistics["average_rating"]), 2)
                if review_statistics["average_rating"] is not None
                else None
            ),
        },
    }


@router.get("/attendance")
def attendance_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    if end_date < start_date:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date",
        )

    rows = (
        db.query(
            Attendance.status,
            func.count(Attendance.id),
            func.coalesce(func.sum(Attendance.overtime_hours), 0),
        )
        .filter(
            Attendance.date >= start_date,
            Attendance.date <= end_date,
        )
        .group_by(Attendance.status)
        .all()
    )

    statistics = {
        status.value: {"count": 0, "overtime_hours": 0.0}
        for status in AttendanceStatus
    }

    for status, count, overtime in rows:
        statistics[status.value] = {
            "count": count,
            "overtime_hours": round(float(overtime), 2),
        }

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_records": sum(item["count"] for item in statistics.values()),
        "by_status": statistics,
    }


@router.get("/leaves")
def leave_report(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    query = db.query(Leave)

    if start_date is not None:
        query = query.filter(Leave.start_date >= start_date)
    if end_date is not None:
        query = query.filter(Leave.start_date <= end_date)
    if start_date is not None and end_date is not None and end_date < start_date:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date",
        )

    statistics = {
        status.value: query.filter(Leave.status == status).count()
        for status in LeaveStatus
    }

    by_type = {
        leave_type.value: query.filter(Leave.leave_type == leave_type).count()
        for leave_type in __import__(
            "app.models.leave", fromlist=["LeaveType"]
        ).LeaveType
    }

    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "total_requests": sum(statistics.values()),
        "by_status": statistics,
        "by_type": by_type,
    }


@router.get("/payroll")
def payroll_report(
    month: str | None = Query(
        default=None,
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Optional payroll month in YYYY-MM format",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    query = db.query(Payroll)
    if month:
        query = query.filter(Payroll.month == month)

    summary = query.with_entities(
        func.count(Payroll.id),
        func.coalesce(func.sum(Payroll.basic_salary), 0),
        func.coalesce(func.sum(Payroll.deductions), 0),
        func.coalesce(func.sum(Payroll.bonus), 0),
        func.coalesce(func.sum(Payroll.net_salary), 0),
    ).first()

    return {
        "month": month,
        "record_count": summary[0],
        "total_basic_salary": float(summary[1]),
        "total_deductions": float(summary[2]),
        "total_bonus": float(summary[3]),
        "total_net_salary": float(summary[4]),
    }


@router.get("/performance")
def performance_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    published = db.query(PerformanceReview).filter(
        PerformanceReview.status == "PUBLISHED"
    )

    average_rating = published.with_entities(
        func.avg(PerformanceReview.rating)
    ).scalar()

    distribution = {
        rating: published.filter(
            PerformanceReview.rating == rating
        ).count()
        for rating in range(1, 6)
    }

    return {
        "published_reviews": published.count(),
        "average_rating": (
            round(float(average_rating), 2)
            if average_rating is not None
            else None
        ),
        "rating_distribution": distribution,
    }



@router.get("/export/{report_type}")
def export_analytics_csv(
    report_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "employees":
        writer.writerow(["Employee ID", "Name", "Status"])
        for employee in db.query(Employee).all():
            writer.writerow([
                employee.id,
                getattr(employee, "name", ""),
                getattr(employee.status, "value", employee.status),
            ])

    elif report_type == "attendance":
        writer.writerow([
            "Attendance ID", "Employee ID", "Date", "Status",
            "Check In", "Check Out", "Overtime Hours",
        ])
        for record in db.query(Attendance).all():
            writer.writerow([
                record.id,
                record.employee_id,
                record.date,
                getattr(record.status, "value", record.status),
                record.check_in,
                record.check_out,
                getattr(record, "overtime_hours", 0),
            ])

    elif report_type == "leaves":
        writer.writerow([
            "Leave ID", "Employee ID", "Type", "Start Date",
            "End Date", "Status",
        ])
        for record in db.query(Leave).all():
            writer.writerow([
                record.id,
                record.employee_id,
                getattr(record.leave_type, "value", getattr(record, "type", "")),
                record.start_date,
                record.end_date,
                getattr(record.status, "value", record.status),
            ])

    elif report_type == "payroll":
        writer.writerow([
            "Payroll ID", "Employee ID", "Month", "Basic Salary",
            "Deductions", "Bonus", "Net Salary",
        ])
        for record in db.query(Payroll).all():
            writer.writerow([
                record.id,
                record.employee_id,
                record.month,
                record.basic_salary,
                record.deductions,
                record.bonus,
                record.net_salary,
            ])

    elif report_type == "performance":
        writer.writerow([
            "Review ID", "Employee ID", "Reviewer ID",
            "Review Period Start", "Review Period End", "Rating", "Status",
        ])
        for record in db.query(PerformanceReview).filter(
            PerformanceReview.status == "PUBLISHED"
        ).all():
            writer.writerow([
                record.id,
                record.employee_id,
                record.reviewer_id,
                record.review_period_start,
                record.review_period_end,
                record.rating,
                record.status,
            ])

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type. Use employees, attendance, leaves, payroll, or performance.",
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="worksphere_{report_type}_report.csv"'
        },
    )

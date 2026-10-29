from app.models.user import User, UserRole
from app.models.employee import Employee, EmployeeStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import Leave, LeaveType, LeaveStatus
from app.models.leave_policy import LeavePolicy, LeaveBalance
from app.models.payroll import Payroll
from app.models.notification import Notification
from app.models.shift import Shift, EmployeeShift
from app.models.document import EmployeeDocument
from app.models.performance_review import PerformanceReview
from app.models.onboarding import Onboarding, OnboardingStatus
from app.models.resignation import Resignation, ResignationStatus

__all__ = [
    "User",
    "UserRole",
    "Employee",
    "EmployeeStatus",
    "Attendance",
    "AttendanceStatus",
    "Leave",
    "LeaveType",
    "LeaveStatus",
    "LeavePolicy",
    "LeaveBalance",
    "Payroll",
    "Notification",
    "Shift",
    "EmployeeShift",
    "EmployeeDocument",
    "PerformanceReview",
    "Onboarding",
    "OnboardingStatus",
    "Resignation",
    "ResignationStatus",
]

from app.models.announcement import Announcement

__all__.append('Announcement')

from app.models.task import Task, TaskStatus

__all__.extend(["Task", "TaskStatus"])

from app.models.feedback import EmployeeFeedback, FeedbackStatus
__all__.extend(['EmployeeFeedback', 'FeedbackStatus'])

from app.models.settings import NotificationPreferences
__all__.append('NotificationPreferences')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine
import app.models

from app.routers import analytics
from app.routers import shifts
from app.routers import documents
from app.routers import performance_reviews
from app.routers import onboarding
from app.routers import resignations
from app.routers import announcements
from app.routers import (
    leave_policies,
    auth,
    users,
    employees,
    attendance,
    leaves,
    payroll,
    notifications,
    dashboard,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="WorkSphere Human Resource Management System API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(shifts.router)
app.include_router(documents.router)
app.include_router(performance_reviews.router)
app.include_router(onboarding.router)
app.include_router(resignations.router)
app.include_router(announcements.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leaves.router)
app.include_router(leave_policies.router)
app.include_router(payroll.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to WorkSphere HRMS API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": settings.app_name,
    }


from app.routers import tasks

app.include_router(tasks.router)

from app.routers import feedback
app.include_router(feedback.router)


from app.routers import settings as settings_router
app.include_router(settings_router.router)




from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine
import app.models

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

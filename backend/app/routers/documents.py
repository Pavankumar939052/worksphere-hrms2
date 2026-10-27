import os
import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_roles
from app.database import get_db
from app.models.document import EmployeeDocument
from app.models.employee import Employee
from app.models.user import User, UserRole

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}
ALLOWED_CONTENT_TYPES = {
    ".pdf": {"application/pdf"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".doc": {"application/msword", "application/octet-stream"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    },
}


def get_employee_for_user(db: Session, user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="No employee record is linked to this account",
        )
    return employee


def can_access_document(user: User, employee: Employee) -> bool:
    return (
        user.role in (UserRole.HR, UserRole.ADMIN)
        or employee.user_id == user.id
    )


@router.post("/upload/{employee_id}", status_code=status.HTTP_201_CREATED)
async def upload_document(
    employee_id: int,
    document_type: str = Form(..., min_length=1, max_length=100),
    expiry_date: date | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if not original_name or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file extension",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES[extension]:
        raise HTTPException(
            status_code=415,
            detail="File content type does not match an allowed type",
        )

    stored_name = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_name
    size = 0

    try:
        with destination.open("xb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File exceeds the 5 MB limit",
                    )
                output.write(chunk)

        if size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        document = EmployeeDocument(
            employee_id=employee.id,
            original_filename=original_name[:255],
            stored_filename=stored_name,
            document_type=document_type.strip(),
            expiry_date=expiry_date,
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "id": document.id,
            "employee_id": document.employee_id,
            "original_filename": document.original_filename,
            "document_type": document.document_type,
            "uploaded_at": document.uploaded_at,
            "expiry_date": document.expiry_date,
        }
    except Exception:
        if destination.exists():
            destination.unlink()
        db.rollback()
        raise
    finally:
        await file.close()


@router.get("/")
def list_documents(
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EmployeeDocument)

    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        employee = get_employee_for_user(db, current_user)
        query = query.filter(EmployeeDocument.employee_id == employee.id)
    elif employee_id is not None:
        query = query.filter(EmployeeDocument.employee_id == employee_id)

    documents = query.order_by(EmployeeDocument.uploaded_at.desc()).all()
    return [
        {
            "id": doc.id,
            "employee_id": doc.employee_id,
            "original_filename": doc.original_filename,
            "document_type": doc.document_type,
            "uploaded_at": doc.uploaded_at,
            "expiry_date": doc.expiry_date,
        }
        for doc in documents
    ]


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.id == document_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    employee = db.query(Employee).filter(Employee.id == document.employee_id).first()
    if not employee or not can_access_document(current_user, employee):
        raise HTTPException(status_code=403, detail="Permission denied")

    safe_path = (UPLOAD_DIR / document.stored_filename).resolve()
    if safe_path.parent != UPLOAD_DIR.resolve() or not safe_path.is_file():
        raise HTTPException(status_code=404, detail="Stored document not found")

    return FileResponse(
        path=safe_path,
        filename=document.original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.HR, UserRole.ADMIN)
    ),
):
    document = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.id == document_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    stored_path = (UPLOAD_DIR / document.stored_filename).resolve()
    if stored_path.parent == UPLOAD_DIR.resolve() and stored_path.is_file():
        stored_path.unlink()

    db.delete(document)
    db.commit()
    return None

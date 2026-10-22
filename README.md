# WorkSphere – HR Management System (HRMS)

A full-stack Human Resource Management System built with **FastAPI, React, and SQLite** to streamline employee management and HR operations through a centralized web application.

## Overview

WorkSphere HRMS helps organizations manage employee information, attendance, leave requests, payroll records, notifications, and user access from a single platform.

The system uses JWT authentication and role-based access control to provide different permissions for Employees, HR personnel, and Administrators.

## Key Features

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access control
- Protected API endpoints

### Employee Management
- Create and view employee records
- Update employee information
- Manage employee status
- Restrict operations according to user roles

### Attendance Management
- Employee check-in and check-out
- Personal attendance history
- HR/Admin attendance overview
- Late attendance and overtime tracking
- Manual absence marking by authorized HR/Admin users

### Leave Management
- Submit leave requests
- View personal leave history
- Review and approve or reject requests
- Manage leave types and leave policies

### Payroll Management
- Create payroll records
- View payroll information
- Access personal payroll history
- Prevent duplicate payroll entries for the same employee and payroll month

### Notifications
- View personal notifications
- Track read and unread notifications
- Mark notifications as read

### Dashboard & User Management
- Dashboard summary of HR activities
- User and role management
- Separate access based on authorization level

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, CSS |
| Backend | Python, FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Data Validation | Pydantic |
| Authentication | JWT |
| API Documentation | Swagger UI / OpenAPI |
| Version Control | Git and GitHub |

## Project Structure

```text
worksphere-hrms/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   ├── jwt.py
│   │   │   ├── permissions.py
│   │   │   └── security.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── package-lock.json
└── README.md
```

## Prerequisites

Install the following before running the project:

- Python and pip
- Node.js and npm
- Git

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Pavankumar939052/worksphere-hrms2.git
cd worksphere-hrms2
```

### 2. Configure the Backend

Open a terminal in the project root and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Configure the required environment variables in `backend/.env`. Use a strong, unique secret key and the correct database settings. Do not commit this file to GitHub.

### 3. Start the Backend Server

From the `backend` directory, run:

```powershell
uvicorn app.main:app --reload
```

The backend should be available at:

- **API:** http://127.0.0.1:8000
- **Swagger UI:** http://127.0.0.1:8000/docs
- **Health Check:** http://127.0.0.1:8000/health

### 4. Configure the Frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local development URL printed by Vite, usually:

http://localhost:5173

Ensure that the frontend API configuration in `frontend/src/api/axios.js` points to the running backend.

## API Modules

The backend provides endpoints for the following modules:

| Module | Main functionality |
|---|---|
| Authentication | Registration and login |
| Users | Current-user profile and user management |
| Employees | Employee records and updates |
| Attendance | Check-in, check-out, history, and attendance management |
| Leaves | Leave requests and review workflows |
| Leave Policies | Leave policy management |
| Payroll | Payroll creation and personal payroll history |
| Notifications | Personal notifications and read status |
| Dashboard | HR summary information |

For the complete endpoint list, request parameters, and response schemas, start the backend and visit `/docs`.

## Security

- Passwords are hashed before storage.
- Protected routes require authentication.
- Role-based permissions restrict sensitive operations.
- Environment files, database files, and generated dependencies should not be committed.
- Production deployments should use HTTPS, secure secret management, restricted CORS origins, and appropriate database backups.

## Future Enhancements

- Automated attendance and absence processing
- Expanded unit and integration test coverage
- Production deployment and monitoring
- Advanced HR analytics and reporting
- Additional employee self-service features

## Author

**Pavankumar Nidamanuri**

## License

No license has been specified yet. All rights are reserved by default unless a license is added to the repository.

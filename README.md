# WorkSphere HRMS

A full-stack Human Resource Management System built with **FastAPI, React, and SQLite**. WorkSphere helps organizations manage employees, attendance, leave requests, payroll, performance reviews, documents, and HR reporting through a role-based web application.

## Key Features

### Core HR Management
- JWT-based authentication and user registration/login.
- Role-based access control for Employee, HR, and Admin roles.
- Employee records and employee search/filtering.
- Dashboard summaries and HR activity overview.
- Attendance check-in, check-out, history, late status, and overtime tracking.
- Leave requests, approvals, and leave calendar/team views.
- Payroll record creation and payroll history.
- Notifications and read status.

### Advanced HR Features
- Shift management and attendance workflows.
- Employee document management.
- Performance reviews and ratings.
- Analytics dashboards and HR reports.
- CSV exports for supported data.
- Advanced employee filters for department, role, employment status, attendance status, and performance rating.

> Features and permissions depend on the configured routes and user roles. Review the API documentation when running the application.

## Technology Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT authentication
- Uvicorn

### Frontend
- React
- Vite
- JavaScript
- Axios
- Tailwind CSS
- React Router
- Lucide React
- Recharts

## Project Structure

```text
worksphere-hrms/
├── backend/
│   ├── app/
│   │   ├── core/
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
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before starting:

- Python 3.10 or a version supported by the backend dependencies.
- Node.js and npm.
- Git.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Pavankumar939052/worksphere-hrms2.git
cd worksphere-hrms2
```

### 2. Configure the backend

Open PowerShell in the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and configure the environment variables required by the application. Use a strong, unique secret key and the database URL expected by your configuration.

**Important:** Never commit your real `.env` file, passwords, or JWT secret.

If PowerShell prevents virtual-environment activation, you can run the Python commands using `.\.venv\Scripts\python.exe` instead.

### 3. Start the backend

From the `backend` directory, with the virtual environment activated:

```powershell
python -m uvicorn app.main:app --reload
```

The backend should be available at:

- API base: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs
- Alternative API documentation: http://127.0.0.1:8000/redoc
- Health check, if configured: http://127.0.0.1:8000/health

Keep this terminal open while using the frontend.

### 4. Start the frontend

Open a second PowerShell terminal in the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

http://localhost:5173

Ensure the frontend API configuration points to the backend at `http://127.0.0.1:8000` and that the backend CORS settings allow the frontend origin.

## Database Setup

WorkSphere uses SQLite by default in the configured development environment.

- The application may create its database tables during startup, depending on its database initialization code.
- Use the database URL specified in `backend/.env`.
- A fresh clone does not include your private local database when database files are excluded from Git.
- Create or register the required user accounts and employee records before testing role-specific workflows.

Do not delete or reset an existing database when updating the project.

## Authentication and Roles

WorkSphere uses bearer-token authentication for protected API endpoints.

1. Register or create a user account using the available authentication endpoint.
2. Log in to obtain an access token.
3. Authenticate protected requests through the application's login flow.
4. Access features permitted for the account's role.

Available roles include Employee, HR, and Admin. Actual permissions are enforced by the backend.

## Development and Testing

### Backend

Run these commands from `backend`:

```powershell
python -m compileall app
```

If automated tests are configured, run:

```powershell
python -m pytest
```

### Frontend

Run these commands from `frontend`:

```powershell
npm run build
```

Run the development server with:

```powershell
npm run dev
```

## Security Notes

- Keep `.env` and other secret files private.
- Never publish access tokens, passwords, private keys, or production credentials.
- Do not commit local SQLite databases or database backups.
- Use HTTPS, secure deployment settings, and a strong secret key in production.
- Restrict CORS to trusted frontend origins.
- Use appropriate access controls and validate all incoming data.
- Review authentication, authorization, and database backup procedures before deployment.

## Known Development Considerations

This repository is configured for local development. Before production deployment, verify database migrations, automated test coverage, logging, error handling, secure cookie/token handling where applicable, and deployment-specific configuration.

## Future Improvements

- Expanded automated tests and continuous integration.
- Production deployment and monitoring.
- Database migration management.
- Additional reporting and workflow automation.

## Author

**Pavankumar Nidamanuri**

## License

No license has been specified yet. Unless a license is added to the repository, the code should not be assumed to be open source or freely reusable.

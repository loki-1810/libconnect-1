# LibConnect

LibConnect is a production-structured library management system for students, librarians, library administrators, and platform administrators. It provides a React 19 web app and an async FastAPI/MongoDB REST API.

## What is included

- JWT authentication, password hashing, persistent sessions, protected routes, and student/librarian/admin role authorization.
- Public catalogue search with ISBN, title, author, category, publisher, language, availability, and publication-year filters.
- Library application and admin approval workflow.
- Book catalogue administration, borrowing approval/rejection, returns, due dates, overdue fines, reservations, queues, and notifications.
- Role-focused dashboards, activity summaries, reporting data, user management, responsive layouts, empty/loading/error states, toast feedback, and 404 handling.
- MongoDB indexes, pagination, input validation, centralized API clients, API documentation, seed data, configuration examples, and a Postman collection.

## Repository layout

```text
frontend/  React 19 + Vite + Tailwind web application
backend/   FastAPI + Motor/MongoDB REST service
docs/      API notes and Postman collection
```

## Run locally

Prerequisites: Node.js 20+, Python 3.11+, and a MongoDB Atlas cluster (or local MongoDB).

1. Configure the API.

   ```powershell
   cd backend
   Copy-Item .env.example .env
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. Configure and run the web app in a second terminal.

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

Open `http://localhost:5173`; FastAPI documentation is at `http://localhost:8000/docs`.

## Seed data

After configuring MongoDB, run the following from `backend/`:

```powershell
python -m scripts.seed
```

The seed includes an administrator, a librarian, a student, one approved library, and four catalogue titles. All demo accounts use `LibConnect123!`:

| Role | Email |
| --- | --- |
| Admin | `admin@libconnect.local` |
| Librarian | `librarian@libconnect.local` |
| Student | `student@libconnect.local` |

## Deployment

- Deploy `frontend/` to Vercel with `VITE_API_URL` set to the deployed API URL plus `/api/v1`.
- Deploy `backend/` to Render or Railway using `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Set production `MONGODB_URI`, a unique `JWT_SECRET_KEY`, and exact comma-separated `FRONTEND_ORIGINS` in the API environment.

Further endpoint notes and a ready-to-import Postman collection are in [docs/API.md](docs/API.md).

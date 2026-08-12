# CivicIssue

Smart civic complaint management platform.

**Stack:** React (Vite) · Python · FastAPI · PostgreSQL · SQLAlchemy · REST APIs

## Project layout

```
civicissue/
├── backend/               # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── main.py        # App entry, CORS, static /uploads
│   │   ├── database.py    # Async engine + session
│   │   ├── models.py      # SQLAlchemy models (User, Issue)
│   │   ├── schemas.py     # Pydantic request/response schemas
│   │   ├── security.py    # bcrypt + JWT auth
│   │   ├── seed.py        # Default admin + sample data
│   │   └── routers/       # auth, issues, admin
│   ├── requirements.txt
│   └── .env.example
├── frontend/              # React (Vite) SPA
│   └── src/
└── render.yaml            # Render Blueprint (deploy everything)
```

## Run locally

### 1. Backend (FastAPI)

Requires Python 3.10+ and PostgreSQL running locally.

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
```

Create `backend/.env` (see `.env.example`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicissue
JWT_SECRET=some-long-random-string
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173
```

Create the database (if not present) and start the server:

```bash
createdb civicissue            # or via psql: CREATE DATABASE civicissue;
uvicorn app.main:app --reload --port 8001
```

On startup the app creates all tables and seeds:

- Default admin: `admin@civicissue.com` / `admin123`
- 50 sample issues with citizen accounts

API docs: http://localhost:8001/docs

> **Why port 8001?** Port 8000 is commonly occupied by Docker Desktop and
> other services on Windows. The backend runs on **8001** locally, and the
> Vite dev server proxies `/api` and `/uploads` to it (see `vite.config.js`),
> so the frontend works with zero CORS/port-config hassle.

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

`src/api.js` uses relative `/api` URLs that the Vite dev server proxies to the
FastAPI backend on port 8001. For a deployed build, set `VITE_API_URL` to the
backend's public URL (it is inlined at build time).

## REST API overview

| Method | Path                             | Auth   | Description                       |
|--------|----------------------------------|--------|-----------------------------------|
| POST   | `/api/auth/register`             | –      | Register (name, email, password)  |
| POST   | `/api/auth/login`                | –      | Login → `{ token }`               |
| POST   | `/api/issues`                    | JWT    | Create issue (JSON or multipart)  |
| GET    | `/api/issues/my`                 | JWT    | Current user's issues             |
| GET    | `/api/issues/{id}`               | JWT    | Issue detail (owner or admin)     |
| GET    | `/api/admin/issues`              | ADMIN  | Search/filter issues              |
| PATCH  | `/api/admin/issues/{id}/status`  | ADMIN  | Update status                     |
| PATCH  | `/api/admin/issues/{id}/priority`| ADMIN  | Update priority                   |
| GET    | `/api/admin/dashboard`           | ADMIN  | Stats, category & daily trends    |
| GET    | `/api/admin/users`               | ADMIN  | List users                        |
| PATCH  | `/api/admin/users/{id}/role`     | ADMIN  | Promote/demote admin              |

## Deploy to Render

The included `render.yaml` is a Blueprint that provisions all three pieces:
**API web service**, **frontend static site**, and a **PostgreSQL database**.

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo.
3. Render auto-detects `render.yaml`, creates the DB, API and frontend services.
4. Before deploying, edit `render.yaml` if you want custom names, e.g.:
   - Change `civicissue-frontend` service name → update `CORS_ORIGINS`
     value in the API service to match the new frontend URL.
   - The frontend `VITE_API_URL` must equal the final API URL.

### Option B — Manual

**Database**
1. Create a PostgreSQL instance on Render (free tier works).
2. Copy its `Internal Database URL`.

**API web service**
1. New → Web Service → point at the repo → `Root Directory: backend`.
2. Runtime: Python. Build: `pip install -r requirements.txt`.
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Env vars:
   - `DATABASE_URL` = the Postgres connection string from step 1
   - `JWT_SECRET` = a long random string
   - `CORS_ORIGINS` = your frontend URL (e.g. `https://myapp.onrender.com`)
   - `PYTHON_VERSION` = `3.10.11`

**Frontend static site**
1. New → Static Site → same repo → `Root Directory: frontend`.
2. Build: `npm ci && npm run build`. Publish directory: `dist`.
3. Env var (build-time): `VITE_API_URL` = your API service URL.
4. Redeploy once the API URL is known so the bundle points at the right host.

### Notes / limitations

- **Uploaded images** are stored in an in-repo `uploads/` folder. On Render
  this is ephemeral (lost on redeploy/restart). For persistent file storage,
  use Render Disks (paid) or an object store such as S3.
- **Free-tier web services** sleep after ~15 min of inactivity; the first
  request after waking may be slow.
- **Emails** are not sent via SMTP in this deployment; they are logged to the
  service logs. Wire up an SMTP provider and edit `app/email_service.py` to
  send real emails.

## Default credentials

| Role    | Email                   | Password   |
|---------|-------------------------|------------|
| Admin   | admin@civicissue.com    | admin123   |
| Citizen | (seeded sample users)   | password123|

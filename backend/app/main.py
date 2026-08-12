import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .routers import api
from .seed import seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicissue")

DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from .database import AsyncSessionLocal

    await init_db()
    async with AsyncSessionLocal() as db:
        await seed(db)
    logger.info("Application started")
    yield


app = FastAPI(title="CivicIssue API", version="1.0.0", lifespan=lifespan)

configured_origins = os.getenv("CORS_ORIGINS", "").strip()
origins = (
    [o.strip() for o in configured_origins.split(",") if o.strip()]
    if configured_origins
    else DEFAULT_ORIGINS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router, prefix="/api")


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"message": detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"message": "Internal server error"})


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
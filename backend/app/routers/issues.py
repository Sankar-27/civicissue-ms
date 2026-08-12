import math
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..email_service import send_duplicate_rejection_email, send_issue_submitted_email
from ..models import Category, Issue, IssueStatus, Priority, Role, User
from ..schemas import IssueCreate, IssueResponse
from ..security import get_current_user

router = APIRouter(prefix="/issues", tags=["issues"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def _parse_category(value: str | None) -> Category:
    if value is None or not value.strip():
        return Category.OTHER
    try:
        return Category(value.strip().upper())
    except ValueError:
        return Category.OTHER


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _save_image(data: bytes, filename: str) -> str | None:
    if not data:
        return None
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
        f.write(data)
    return f"/uploads/{name}"


def to_issue_dict(issue: Issue) -> dict:
    return {
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category.value if isinstance(issue.category, Category) else issue.category,
        "status": issue.status.value if isinstance(issue.status, IssueStatus) else issue.status,
        "priority": issue.priority.value if isinstance(issue.priority, Priority) else issue.priority,
        "latitude": issue.latitude,
        "longitude": issue.longitude,
        "imageUrl": issue.image_url,
        "createdAt": issue.created_at,
        "duplicateOfId": issue.duplicate_of_id,
    }


async def _find_duplicate(
    db: AsyncSession, category: Category, latitude: float, longitude: float
) -> int | None:
    result = await db.execute(
        select(Issue).where(
            Issue.category == category,
            Issue.status.in_([IssueStatus.OPEN, IssueStatus.IN_PROGRESS]),
            Issue.latitude.isnot(None),
            Issue.longitude.isnot(None),
        )
    )
    for candidate in result.scalars():
        if _haversine(latitude, longitude, candidate.latitude, candidate.longitude) <= 100.0:
            return candidate.id
    return None


@router.post("")
async def create_issue(
    request: Request,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> str:
    content_type = request.headers.get("content-type", "").lower()
    image_bytes: bytes | None = None
    image_filename: str | None = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        title = str(form.get("title", "")).strip()
        description = str(form.get("description", "")).strip()
        latitude = _to_float(form.get("latitude"))
        longitude = _to_float(form.get("longitude"))
        category = _parse_category(form.get("category"))
        image_file = form.get("image")
        if image_file is not None and getattr(image_file, "filename", None):
            image_bytes = await image_file.read()
            image_filename = image_file.filename
    elif "application/json" in content_type:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
        payload = IssueCreate(**body)
        title = payload.title.strip()
        description = payload.description.strip()
        latitude = payload.latitude
        longitude = payload.longitude
        category = _parse_category(payload.category)
    else:
        raise HTTPException(status_code=415, detail="Content-Type must be application/json or multipart/form-data")

    if not title or not description:
        raise HTTPException(status_code=400, detail="Title and description are required")

    image_url = _save_image(image_bytes or b"", image_filename or "")

    duplicate_of_id = None
    status = IssueStatus.OPEN
    message = "Issue created successfully"

    if latitude is not None and longitude is not None:
        duplicate_of_id = await _find_duplicate(db, category, latitude, longitude)
        if duplicate_of_id is not None:
            status = IssueStatus.REJECTED
            message = f"Issue is a duplicate of existing issue #{duplicate_of_id} and has been auto-rejected"

    issue = Issue(
        title=title,
        description=description,
        latitude=latitude,
        longitude=longitude,
        category=category,
        image_url=image_url,
        status=status,
        priority=Priority.MEDIUM,
        reported_by=user,
        duplicate_of_id=duplicate_of_id,
    )
    db.add(issue)
    await db.commit()

    if status == IssueStatus.REJECTED:
        send_duplicate_rejection_email(user.email, issue.title, duplicate_of_id)
    else:
        send_issue_submitted_email(user.email, issue.title)

    return message


@router.get("/my", response_model=list[IssueResponse])
async def get_my_issues(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[dict]:
    result = await db.execute(
        select(Issue).where(Issue.reported_by_id == user.id).order_by(Issue.created_at.desc())
    )
    return [to_issue_dict(issue) for issue in result.scalars()]


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue_by_id(
    issue_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    if user.role != Role.ADMIN and issue.reported_by_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this issue")

    return to_issue_dict(issue)


def _to_float(value) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

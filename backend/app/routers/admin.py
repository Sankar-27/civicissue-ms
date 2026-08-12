from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..email_service import send_status_update_email
from ..models import Category, Issue, IssueStatus, Priority, Role, User
from ..schemas import DashboardStatsResponse, UserResponse
from ..security import require_admin
from .issues import to_issue_dict

router = APIRouter(prefix="/admin", tags=["admin"])


def _enum_value(enum_cls, value: Optional[str]):
    if value is None or not str(value).strip():
        return None
    try:
        return enum_cls(str(value).strip().upper())
    except ValueError:
        return None


@router.get("/issues", response_model=list[dict])
async def search_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[dict]:
    statement = select(Issue)

    status_enum = _enum_value(IssueStatus, status)
    priority_enum = _enum_value(Priority, priority)
    category_enum = _enum_value(Category, category)

    if status_enum is not None:
        statement = statement.where(Issue.status == status_enum)
    if priority_enum is not None:
        statement = statement.where(Issue.priority == priority_enum)
    if category_enum is not None:
        statement = statement.where(Issue.category == category_enum)

    search_str = (search or "").strip().lower()
    if search_str:
        statement = statement.where(
            func.lower(Issue.title).like(f"%{search_str}%")
            | func.lower(Issue.description).like(f"%{search_str}%")
        )

    statement = statement.order_by(Issue.created_at.desc())
    result = await db.execute(statement)
    return [to_issue_dict(issue) for issue in result.scalars()]


@router.patch("/issues/{issue_id}/status")
async def update_issue_status(
    issue_id: int,
    request: Request,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> str:
    body = await _json_body(request)
    status_str = request.query_params.get("status") or (body or {}).get("status")
    if not status_str:
        raise HTTPException(status_code=400, detail="Status is required")

    new_status = _enum_value(IssueStatus, status_str)
    if new_status is None:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_status = issue.status.value
    issue.status = new_status
    await db.commit()

    send_status_update_email(
        issue.reported_by.email, issue.title, old_status, new_status.value
    )
    return f"Issue status updated to {new_status.value}"


@router.patch("/issues/{issue_id}/priority")
async def update_issue_priority(
    issue_id: int,
    request: Request,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> str:
    body = await _json_body(request)
    priority_str = request.query_params.get("priority") or (body or {}).get("priority")
    if not priority_str:
        raise HTTPException(status_code=400, detail="Priority is required")

    new_priority = _enum_value(Priority, priority_str)
    if new_priority is None:
        raise HTTPException(status_code=400, detail="Invalid priority")

    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue is None:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.priority = new_priority
    await db.commit()

    return f"Issue priority updated to {new_priority.value}"


@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> DashboardStatsResponse:
    total = (await db.execute(select(func.count(Issue.id)))).scalar_one()
    open_count = (await db.execute(select(func.count(Issue.id)).where(Issue.status == IssueStatus.OPEN))).scalar_one()
    in_progress = (await db.execute(select(func.count(Issue.id)).where(Issue.status == IssueStatus.IN_PROGRESS))).scalar_one()
    resolved = (await db.execute(select(func.count(Issue.id)).where(Issue.status == IssueStatus.RESOLVED))).scalar_one()
    rejected = (await db.execute(select(func.count(Issue.id)).where(Issue.status == IssueStatus.REJECTED))).scalar_one()
    critical = (await db.execute(select(func.count(Issue.id)).where(Issue.priority == Priority.CRITICAL))).scalar_one()

    category_stats = {cat.value: 0 for cat in Category}
    result = await db.execute(
        select(Issue.category, func.count(Issue.id)).group_by(Issue.category)
    )
    for cat, count in result.all():
        if cat is not None:
            category_stats[cat.value if hasattr(cat, "value") else str(cat)] = count

    today = datetime.utcnow().date()
    start = datetime.combine(today - timedelta(days=6), datetime.min.time())
    daily_trends = {(today - timedelta(days=i)).isoformat(): 0 for i in range(6, -1, -1)}

    result = await db.execute(
        select(Issue.created_at).where(Issue.created_at >= start)
    )
    for (created_at,) in result.all():
        key = created_at.date().isoformat()
        if key in daily_trends:
            daily_trends[key] += 1

    result = await db.execute(
        select(Issue).order_by(Issue.created_at.desc()).limit(5)
    )
    recently_reported = [to_issue_dict(i) for i in result.scalars()]

    return DashboardStatsResponse(
        totalComplaints=total,
        openComplaints=open_count,
        inProgressComplaints=in_progress,
        resolvedComplaints=resolved,
        rejectedComplaints=rejected,
        criticalComplaints=critical,
        categoryStats=category_stats,
        dailyTrends=daily_trends,
        recentlyReported=recently_reported,
    )


@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[User]:
    result = await db.execute(select(User).order_by(User.id))
    return list(result.scalars())


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> str:
    body = await _json_body(request)
    role_str = request.query_params.get("role") or (body or {}).get("role")
    if not role_str:
        raise HTTPException(status_code=400, detail="Role is required")

    try:
        new_role = Role(str(role_str).strip().upper())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    await db.commit()

    return f"User role updated to {new_role.value}"


async def _json_body(request: Request) -> Optional[dict]:
    content_type = request.headers.get("content-type", "").lower()
    if "application/json" not in content_type:
        return None
    try:
        return await request.json()
    except Exception:
        return None

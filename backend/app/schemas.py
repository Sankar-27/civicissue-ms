from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from .models import Category, IssueStatus, Priority, Role


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, description="Full name")
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Valid email")
    password: str = Field(min_length=6, description="Minimum 6 characters")


class LoginRequest(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str


class AuthResponse(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: Role


class IssueCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    category: Category
    status: IssueStatus
    priority: Priority
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    imageUrl: Optional[str] = None
    createdAt: datetime
    duplicateOfId: Optional[int] = None


class DashboardStatsResponse(BaseModel):
    totalComplaints: int
    openComplaints: int
    inProgressComplaints: int
    resolvedComplaints: int
    rejectedComplaints: int
    criticalComplaints: int
    categoryStats: Dict[str, int]
    dailyTrends: Dict[str, int]
    recentlyReported: List[IssueResponse]


class MessageResponse(BaseModel):
    message: str

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from .database import Base


class Role(str, enum.Enum):
    CITIZEN = "CITIZEN"
    ADMIN = "ADMIN"


class Category(str, enum.Enum):
    ROAD = "ROAD"
    WATER = "WATER"
    ELECTRICITY = "ELECTRICITY"
    SANITATION = "SANITATION"
    STREETLIGHT = "STREETLIGHT"
    DRAINAGE = "DRAINAGE"
    OTHER = "OTHER"


class IssueStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


def _enum_column(enum_cls):
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=20,
        values_callable=lambda e: [m.value for m in e],
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(_enum_column(Role), nullable=False, default=Role.CITIZEN)

    issues = relationship("Issue", back_populates="reported_by")


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    category = Column(_enum_column(Category), nullable=False, default=Category.OTHER)
    image_url = Column(String(500), nullable=True)
    status = Column(_enum_column(IssueStatus), nullable=False, default=IssueStatus.OPEN)
    priority = Column(_enum_column(Priority), nullable=False, default=Priority.MEDIUM)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    duplicate_of_id = Column(Integer, nullable=True)

    reported_by = relationship("User", back_populates="issues", lazy="selectin")

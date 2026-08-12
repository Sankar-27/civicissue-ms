from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Role, User
from ..schemas import AuthResponse, LoginRequest, MessageResponse, RegisterRequest
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=MessageResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_session),
) -> MessageResponse:
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        name=request.name.strip(),
        email=request.email,
        password=hash_password(request.password),
        role=Role.CITIZEN,
    )
    db.add(user)
    await db.commit()

    return MessageResponse(message="User registered successfully")


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_session),
) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return AuthResponse(token=create_access_token(user))

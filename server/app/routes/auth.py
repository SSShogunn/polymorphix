import random

from app.database import db
from app.dependencies import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.schemas.auth import AuthResponse, UserResponse, UserSignIn, UserSignUp
from fastapi import APIRouter, Depends, HTTPException, status
from prisma.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
async def sign_up(user_data: UserSignUp):
    existing_email = await db.user.find_unique(where={"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    username = user_data.username
    if not username:
        username = user_data.email.split("@")[0].strip() or "user"
        if len(username) < 3:
            username = username + "12"
        username = username[:50]

    existing_username = await db.user.find_unique(where={"username": username})
    if existing_username:
        username = f"{username}{random.randint(100, 999)}"

    user = await db.user.create(
        data={
            "email": user_data.email,
            "username": username,
            "password": hash_password(user_data.password),
        }
    )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            avatar_url=user.avatarUrl,
            is_active=user.isActive,
            created_at=user.createdAt,
        ),
    )


@router.post("/signin", response_model=AuthResponse)
async def sign_in(user_data: UserSignIn):
    user = await db.user.find_unique(where={"email": user_data.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(data={"sub": user.id, "email": user.email})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            avatar_url=user.avatarUrl,
            is_active=user.isActive,
            created_at=user.createdAt,
        ),
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        avatar_url=current_user.avatarUrl,
        is_active=current_user.isActive,
        created_at=current_user.createdAt,
    )

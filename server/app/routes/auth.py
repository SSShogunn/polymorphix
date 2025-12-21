from fastapi import APIRouter, HTTPException, responses, status, Depends
from supabase import create_client, Client
from app.config import settings
from app.schemas.auth import UserSignUp, UserSignIn, AuthResponse, UserResponse
from app.dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


@router.post(
    "/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
def sign_up(user_data: UserSignUp):
    try:
        response = supabase.auth.sign_up(
            {"email": user_data.email, "password": user_data.password}
        )

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User Registration Failed",
            )

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "created_at": response.user.created_at,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/signin", response_model=AuthResponse)
def sign_in(user_data: UserSignIn):
    try:
        response = supabase.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "created_at": response.user.created_at,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )


@router.post("/signout")
async def sign_out(current_user: dict = Depends(get_current_user)):
    try:
        supabase.auth.sign_out()
        return {"message": "Successfully signed out"}

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": str(current_user.created_at),
    }


@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.auth.refresh_session()

        return {"access_token": response.session.access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not refresh token"
        )

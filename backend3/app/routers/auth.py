
from fastapi import APIRouter, HTTPException, status
from app.dependencies.auth import get_current_user
from fastapi import Depends
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    AuthResponse,
)
from app.services.auth_service import signup_user, login_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(data: SignupRequest):
    try:
        return signup_user(
            name=data.name,
            email=str(data.email),
            password=data.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest):
    try:
        return login_user(
            email=str(data.email),
            password=data.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )

# dashboard route restricted to authenticated users

@router.get("/dashboard")
def dashboard(current_user: dict = Depends(get_current_user)):
    return {
        "message": f"Welcome, {current_user['name']}!",
        "userId": current_user["id"],
    }

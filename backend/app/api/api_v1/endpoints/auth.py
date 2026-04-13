from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.services.auth import authenticate_user, create_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token, user = authenticate_user(db, payload.email, payload.password)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/register", response_model=UserRead)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = create_user(db, payload.full_name, payload.email, payload.password, payload.role)
    return UserRead.model_validate(user)


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)):
    return UserRead.model_validate(current_user)

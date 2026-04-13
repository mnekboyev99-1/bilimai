from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


def authenticate_user(db: Session, email: str, password: str) -> tuple[str, User]:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        raise AppError("Email yoki parol noto‘g‘ri.", status_code=401)
    token = create_access_token(user.id, user.role)
    return token, user


def create_user(db: Session, full_name: str, email: str, password: str, role: str) -> User:
    email = email.lower()
    if db.query(User).filter(User.email == email).first():
        raise AppError("Bu email allaqachon ro‘yxatdan o‘tgan.")
    user = User(full_name=full_name, email=email, password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

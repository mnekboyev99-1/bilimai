from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def seed_users() -> None:
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return
        parent = User(
            full_name="Dilnoza Karimova",
            email="parent@bilimai.local",
            password_hash=hash_password("password123"),
            role="parent",
        )
        teacher = User(
            full_name="Kamola To‘xtayeva",
            email="teacher@bilimai.local",
            password_hash=hash_password("password123"),
            role="teacher",
        )
        student = User(
            full_name="Aziza Karimova",
            email="student@bilimai.local",
            password_hash=hash_password("password123"),
            role="student",
            parent=parent,
        )
        db.add_all([parent, teacher, student])
        db.commit()
    finally:
        db.close()

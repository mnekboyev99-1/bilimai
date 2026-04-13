from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.errors import register_exception_handlers
from app.services.seed import seed_users

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed_users()

app.include_router(api_router, prefix="/api/v1")
register_exception_handlers(app)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}

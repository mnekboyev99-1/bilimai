from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BilimAI"
    environment: str = "development"
    debug: bool = True
    database_url: str = "sqlite:///./bilimai.db"
    jwt_secret_key: str = "changeme_super_secret_key"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    openai_api_key: str = ""
    openai_model: str = "gpt-5.4-mini"
    cors_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")

    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()

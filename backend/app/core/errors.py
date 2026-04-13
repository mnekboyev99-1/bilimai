from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import get_settings

settings = get_settings()


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    def _cors_headers(request: Request) -> dict[str, str]:
        origin = request.headers.get("origin")
        if settings.is_allowed_origin(origin):
            return {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin",
            }
        return {}

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
            headers=_cors_headers(request),
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"detail": f"Kutilmagan xatolik yuz berdi: {str(exc)}"},
            headers=_cors_headers(request),
        )

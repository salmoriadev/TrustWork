from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import Response

from app.api.routes import router
from app.core.config import settings
from app.services.event_indexer import EscrowEventIndexer


def create_app() -> FastAPI:
    production = settings.app_environment == "production"
    EscrowEventIndexer.validate_abi()
    app = FastAPI(
        title="TrustWork API",
        version="1.0.0",
        description="Off-chain metadata, wallet authentication, and Base Sepolia event projection.",
        docs_url=None if production else "/docs",
        redoc_url=None if production else "/redoc",
        openapi_url=None if production else "/openapi.json",
    )
    if production:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Indexer-Token"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cache-Control"] = (
            "no-store" if request.url.path.startswith("/auth/") else "no-cache"
        )
        return response

    app.include_router(router)
    return app


app = create_app()

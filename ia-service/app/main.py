from fastapi import FastAPI

from app.clients.gemini import GeminiClient
from app.core.config import settings
from app.routes.atividade import create_atividade_router
from app.routes.revisao import create_revisao_router
from app.services.atividade import AtividadeService
from app.services.revisao import RevisaoService

app = FastAPI(
    title="Sabiá - Serviço de IA",
    version="0.1.0",
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)
gemini_client = GeminiClient(
    api_key=settings.gemini_api_key,
    model=settings.gemini_model,
    timeout_seconds=settings.gemini_timeout_seconds,
)
app.include_router(create_atividade_router(AtividadeService(gemini_client)))
app.include_router(create_revisao_router(RevisaoService(gemini_client)))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}



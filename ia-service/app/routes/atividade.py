import logging

from fastapi import APIRouter, HTTPException, status

from app.clients.gemini import GeminiClientError, GeminiNotConfiguredError
from app.schemas.atividade import GerarAtividadeRequest, GerarAtividadeResponse
from app.services.atividade import AtividadeService

logger = logging.getLogger(__name__)


def create_atividade_router(service: AtividadeService) -> APIRouter:
    router = APIRouter(prefix="/atividade")

    @router.post("/gerar", response_model=GerarAtividadeResponse)
    async def gerar_atividade(request: GerarAtividadeRequest) -> GerarAtividadeResponse:
        try:
            return await service.gerar(request)
        except GeminiNotConfiguredError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Serviço de IA temporariamente indisponível.",
            ) from exc
        except (GeminiClientError, ValueError, TypeError, KeyError, IndexError) as exc:
            logger.exception("Erro ao gerar atividade com Gemini: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Serviço de IA temporariamente indisponível.",
            ) from exc

    return router
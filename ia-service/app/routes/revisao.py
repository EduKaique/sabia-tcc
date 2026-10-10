import logging

from fastapi import APIRouter, HTTPException, status

from app.clients.gemini import GeminiClientError, GeminiNotConfiguredError
from app.schemas.revisao import RevisarSubmissaoRequest, RevisarSubmissaoResponse
from app.services.revisao import RevisaoService

logger = logging.getLogger(__name__)


def create_revisao_router(service: RevisaoService) -> APIRouter:
    router = APIRouter(prefix="/submissao")

    @router.post("/revisar", response_model=RevisarSubmissaoResponse)
    async def revisar_submissao(
        request: RevisarSubmissaoRequest,
    ) -> RevisarSubmissaoResponse:
        try:
            return await service.revisar(request)
        except GeminiNotConfiguredError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Serviço de IA temporariamente indisponível.",
            ) from exc
        except (GeminiClientError, ValueError, TypeError, KeyError, IndexError) as exc:
            logger.exception("Erro ao revisar submissão com Gemini: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Serviço de IA temporariamente indisponível.",
            ) from exc

    return router
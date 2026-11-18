import logging

from fastapi import APIRouter, HTTPException, status

from app.clients.gemini import (
    GeminiClientError,
    GeminiCotaEsgotadaError,
    GeminiNotConfiguredError,
)
from app.schemas.atividade_robo import GerarAtividadeRoboRequest, GerarAtividadeRoboResponse
from app.services.atividade_robo import AtividadeRoboService, RespostaIaInvalidaError

logger = logging.getLogger(__name__)


def create_atividade_robo_router(service: AtividadeRoboService) -> APIRouter:
    router = APIRouter(prefix="/atividade")

    @router.post(
        "/gerar-robo",
        response_model=GerarAtividadeRoboResponse,
        response_model_exclude_none=True,
    )
    async def gerar_atividade_robo(
        request: GerarAtividadeRoboRequest,
    ) -> GerarAtividadeRoboResponse:
        try:
            return await service.gerar(request)
        except GeminiNotConfiguredError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Serviço de IA temporariamente indisponível.",
            ) from exc
        except GeminiCotaEsgotadaError as exc:
            logger.warning("Cota do Gemini esgotada.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "codigo": "COTA_IA_ESGOTADA",
                    "mensagem": "A IA atingiu o limite de uso no momento. Tente novamente mais tarde.",
                },
            ) from exc
        except RespostaIaInvalidaError as exc:
            logger.warning("Geração do Jogo do Robô: IA_RESPOSTA_INVALIDA.")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={
                    "codigo": "IA_RESPOSTA_INVALIDA",
                    "mensagem": "A IA não devolveu uma sugestão válida. Tente novamente.",
                },
            ) from exc
        except GeminiClientError as exc:
            # Só o tipo: as mensagens do cliente já são fixas, mas não arriscamos conteúdo.
            logger.warning("Erro ao gerar atividade do Jogo do Robô: %s", type(exc).__name__)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Serviço de IA temporariamente indisponível.",
            ) from exc

    return router

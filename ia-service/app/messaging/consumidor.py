"""Tratamento do evento submissao.enviada: gera a revisão da IA e publica o resultado.

O tratamento é separado do transporte (aio-pika) para ser testável: ``tratar`` devolve
``Resultado.ACK`` (sucesso/duplicada) ou ``Resultado.DLQ`` (malformada ou tentativas esgotadas),
e o chamador faz ack ou reject(requeue=False) -> DLQ.
"""
import asyncio
import enum
import json
import logging
from collections import OrderedDict
from typing import Awaitable, Callable

from pydantic import ValidationError

from app.clients.gemini import GeminiNotConfiguredError
from app.messaging import contratos
from app.schemas.revisao import RevisarSubmissaoAtividade, RevisarSubmissaoRequest
from app.services.revisao import RevisaoService

logger = logging.getLogger("sabia.mensageria")

Publicar = Callable[[contratos.EnvelopeEvento], Awaitable[None]]


class Resultado(enum.Enum):
    ACK = "ack"
    DLQ = "dlq"


class ProcessadorRevisao:
    def __init__(
        self,
        revisao_service: RevisaoService,
        publicar: Publicar,
        max_tentativas: int = 3,
        intervalo_inicial: float = 2.0,
        multiplicador: float = 2.0,
        tamanho_dedup: int = 1000,
        dormir: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        self.revisao_service = revisao_service
        self.publicar = publicar
        self.max_tentativas = max_tentativas
        self.intervalo_inicial = intervalo_inicial
        self.multiplicador = multiplicador
        self.tamanho_dedup = tamanho_dedup
        self.dormir = dormir
        # Idempotência: sem banco no ia-service, guarda os últimos messageIds tratados.
        # O pedagogico também deduplica o resultado (tabela evento_consumido).
        self._processadas: OrderedDict[str, None] = OrderedDict()

    async def tratar(self, corpo: bytes) -> Resultado:
        try:
            envelope = contratos.EnvelopeEvento.model_validate_json(corpo)
            evento = contratos.SubmissaoEnviada.model_validate(envelope.payload)
        except (ValidationError, ValueError) as exc:
            logger.error(
                "Mensagem inválida enviada para a DLQ",
                extra={"motivo": str(exc)[:300]},
            )
            return Resultado.DLQ

        contexto = {
            "messageId": envelope.messageId,
            "correlationId": envelope.correlationId,
            "eventType": envelope.eventType,
            "submissaoId": evento.submissaoId,
        }
        if envelope.messageId in self._processadas:
            logger.info("Mensagem duplicada descartada", extra=contexto)
            return Resultado.ACK

        intervalo = self.intervalo_inicial
        for tentativa in range(1, self.max_tentativas + 1):
            try:
                await self._revisar_e_publicar(envelope, evento)
            except GeminiNotConfiguredError:
                logger.error("IA não configurada; mensagem enviada para a DLQ", extra=contexto)
                return Resultado.DLQ
            except Exception as exc:  # noqa: BLE001 - qualquer falha é tentada de novo
                logger.warning(
                    "Falha ao tratar mensagem",
                    extra={**contexto, "tentativa": tentativa, "motivo": type(exc).__name__},
                )
                if tentativa == self.max_tentativas:
                    logger.error("Tentativas esgotadas; mensagem enviada para a DLQ", extra=contexto)
                    return Resultado.DLQ
                await self.dormir(intervalo)
                intervalo *= self.multiplicador
            else:
                self._registrar(envelope.messageId)
                logger.info("Mensagem tratada", extra={**contexto, "tentativa": tentativa})
                return Resultado.ACK
        return Resultado.DLQ

    async def _revisar_e_publicar(
        self, envelope: contratos.EnvelopeEvento, evento: contratos.SubmissaoEnviada
    ) -> None:
        request = RevisarSubmissaoRequest(
            atividade=RevisarSubmissaoAtividade(**evento.atividade.model_dump()),
            submissaoEstadoJson=evento.estadoJson,
        )
        relatorio = await self.revisao_service.revisar(request)
        resultado = contratos.novo_envelope(
            contratos.REVISAO_IA_GERADA,
            {"submissaoId": evento.submissaoId, **relatorio.model_dump()},
            envelope.correlationId,
        )
        await self.publicar(resultado)

    def _registrar(self, message_id: str) -> None:
        self._processadas[message_id] = None
        while len(self._processadas) > self.tamanho_dedup:
            self._processadas.popitem(last=False)


def serializar(envelope: contratos.EnvelopeEvento) -> bytes:
    return json.dumps(envelope.model_dump(), ensure_ascii=False).encode("utf-8")

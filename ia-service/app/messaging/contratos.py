"""Contratos dos eventos de integração (independentes dos schemas HTTP e das entidades)."""
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field

SUBMISSAO_ENVIADA = "submissao.enviada"
REVISAO_IA_GERADA = "submissao.revisao-ia.gerada"
PRODUTOR = "ia-service"


class AtividadeEvento(BaseModel):
    titulo: str = Field(min_length=1)
    descricao: str | None = None
    pontuacaoMaxima: float = Field(gt=0)
    gabaritoEstadoJson: str | None = None


class SubmissaoEnviada(BaseModel):
    submissaoId: int
    atividadeId: int | None = None
    alunoId: int | None = None
    atividade: AtividadeEvento
    estadoJson: str = Field(min_length=1)


class EnvelopeEvento(BaseModel):
    messageId: str = Field(min_length=1)
    eventType: str
    version: int = 1
    occurredAt: str | None = None
    correlationId: str | None = None
    producer: str | None = None
    payload: dict


def novo_envelope(
    event_type: str, payload: dict, correlation_id: str | None
) -> EnvelopeEvento:
    message_id = str(uuid4())
    return EnvelopeEvento(
        messageId=message_id,
        eventType=event_type,
        occurredAt=datetime.now(timezone.utc).isoformat(),
        correlationId=correlation_id or message_id,
        producer=PRODUTOR,
        payload=payload,
    )

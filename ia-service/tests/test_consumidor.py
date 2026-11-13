import asyncio
import json

from app.clients.gemini import GeminiClientError, GeminiNotConfiguredError
from app.messaging import contratos
from app.messaging.consumidor import ProcessadorRevisao, Resultado
from app.schemas.revisao import ErroRelatorioIa, RevisarSubmissaoResponse


class RevisaoFalsa:
    def __init__(self, falhas: list[Exception] | None = None) -> None:
        self.falhas = list(falhas or [])
        self.chamadas = 0

    async def revisar(self, request):
        self.chamadas += 1
        if self.falhas:
            raise self.falhas.pop(0)
        return RevisarSubmissaoResponse(
            resumo="Bom",
            notaSugerida=8.0,
            acertos=["Laço"],
            erros=[ErroRelatorioIa(descricao="Sem print", severidade="media")],
        )


def evento(message_id: str = "m-1", **payload_extra) -> bytes:
    payload = {
        "submissaoId": 10,
        "atividadeId": 3,
        "alunoId": 7,
        "atividade": {"titulo": "Laços", "descricao": "d", "pontuacaoMaxima": 10, "gabaritoEstadoJson": None},
        "estadoJson": "{}",
        **payload_extra,
    }
    return contratos.EnvelopeEvento(
        messageId=message_id, eventType=contratos.SUBMISSAO_ENVIADA, correlationId="corr-1", payload=payload
    ).model_dump_json().encode()


def criar(revisao, max_tentativas=3):
    publicadas: list[contratos.EnvelopeEvento] = []
    esperas: list[float] = []

    async def publicar(envelope):
        publicadas.append(envelope)

    async def dormir(segundos):
        esperas.append(segundos)

    processador = ProcessadorRevisao(
        revisao, publicar, max_tentativas=max_tentativas, intervalo_inicial=1.0, dormir=dormir
    )
    return processador, publicadas, esperas


def test_publica_revisao_gerada_com_correlation_id_preservado():
    processador, publicadas, _ = criar(RevisaoFalsa())

    assert asyncio.run(processador.tratar(evento())) is Resultado.ACK

    assert len(publicadas) == 1
    saida = publicadas[0]
    assert saida.eventType == "submissao.revisao-ia.gerada"
    assert saida.correlationId == "corr-1"
    assert saida.messageId != "m-1"
    assert saida.producer == "ia-service"
    assert saida.payload["submissaoId"] == 10
    assert saida.payload["notaSugerida"] == 8.0
    assert saida.payload["erros"] == [{"descricao": "Sem print", "severidade": "media"}]
    json.dumps(saida.payload)


def test_mensagem_duplicada_nao_reprocessa():
    revisao = RevisaoFalsa()
    processador, publicadas, _ = criar(revisao)

    assert asyncio.run(processador.tratar(evento("m-dup"))) is Resultado.ACK
    assert asyncio.run(processador.tratar(evento("m-dup"))) is Resultado.ACK

    assert revisao.chamadas == 1
    assert len(publicadas) == 1


def test_falha_transitoria_faz_retry_com_backoff_e_depois_sucede():
    revisao = RevisaoFalsa([GeminiClientError("x"), GeminiClientError("x")])
    processador, publicadas, esperas = criar(revisao)

    assert asyncio.run(processador.tratar(evento())) is Resultado.ACK

    assert revisao.chamadas == 3
    assert esperas == [1.0, 2.0]
    assert len(publicadas) == 1


def test_tentativas_esgotadas_vao_para_dlq():
    revisao = RevisaoFalsa([GeminiClientError("x")] * 5)
    processador, publicadas, esperas = criar(revisao)

    assert asyncio.run(processador.tratar(evento())) is Resultado.DLQ

    assert revisao.chamadas == 3
    assert esperas == [1.0, 2.0]
    assert publicadas == []


def test_falha_ao_publicar_resultado_tambem_faz_retry():
    revisao = RevisaoFalsa()
    falhou = {"vez": 0}
    publicadas = []

    async def publicar(envelope):
        falhou["vez"] += 1
        if falhou["vez"] == 1:
            raise RuntimeError("broker fora")
        publicadas.append(envelope)

    async def dormir(_):
        return None

    processador = ProcessadorRevisao(revisao, publicar, dormir=dormir)

    assert asyncio.run(processador.tratar(evento())) is Resultado.ACK
    assert len(publicadas) == 1


def test_ia_nao_configurada_vai_direto_para_dlq_sem_retry():
    revisao = RevisaoFalsa([GeminiNotConfiguredError("sem chave")])
    processador, _, esperas = criar(revisao)

    assert asyncio.run(processador.tratar(evento())) is Resultado.DLQ
    assert revisao.chamadas == 1
    assert esperas == []


def test_mensagem_malformada_vai_direto_para_dlq():
    revisao = RevisaoFalsa()
    processador, _, _ = criar(revisao)

    assert asyncio.run(processador.tratar(b"nao e json")) is Resultado.DLQ
    assert asyncio.run(processador.tratar(evento(estadoJson=""))) is Resultado.DLQ
    assert revisao.chamadas == 0

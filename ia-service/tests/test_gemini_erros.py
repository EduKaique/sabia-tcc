import json
import logging

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.clients.gemini import GeminiClient
from app.routes.atividade import create_atividade_router
from app.services.atividade import AtividadeService

CHAVE = "AIzaSy-chave-secreta-de-teste-123456"
PAYLOAD = {"idTurma": 1, "tipoAtividade": "ATIVIDADE_TRILHA", "descricaoObjetivo": "Praticar laços"}


def criar_app(api_key: str, handler) -> tuple[TestClient, list[httpx.Request]]:
    requisicoes: list[httpx.Request] = []

    def registrar(request: httpx.Request) -> httpx.Response:
        requisicoes.append(request)
        return handler(request)

    client = GeminiClient(api_key, "gemini-teste", 5, transport=httpx.MockTransport(registrar))
    app = FastAPI()
    app.include_router(create_atividade_router(AtividadeService(client)))
    return TestClient(app), requisicoes


def logs_texto(caplog: pytest.LogCaptureFixture) -> str:
    return "\n".join(
        f"{r.getMessage()} {r.exc_text or ''}" for r in caplog.records
    ) + caplog.text


def test_chave_ausente_responde_503_sem_chamar_o_gemini():
    client, requisicoes = criar_app("", lambda r: httpx.Response(200))

    resposta = client.post("/atividade/gerar", json=PAYLOAD)

    assert resposta.status_code == 503
    assert requisicoes == []


def test_chave_vai_no_header_e_nao_na_url():
    corpo = {"candidates": [{"content": {"parts": [{"text": json.dumps(
        {"titulo": "T", "descricao": "D"})}]}}]}
    client, requisicoes = criar_app(CHAVE, lambda r: httpx.Response(200, json=corpo))

    resposta = client.post("/atividade/gerar", json=PAYLOAD)

    assert resposta.status_code == 200
    assert requisicoes[0].headers["x-goog-api-key"] == CHAVE
    assert CHAVE not in str(requisicoes[0].url)
    assert "key=" not in str(requisicoes[0].url)


def test_429_vira_503_com_codigo_estavel(caplog):
    caplog.set_level(logging.DEBUG)
    corpo = f'{{"error": {{"code": 429, "message": "Quota exceeded for key={CHAVE}"}}}}'
    client, _ = criar_app(CHAVE, lambda r: httpx.Response(429, text=corpo))

    resposta = client.post("/atividade/gerar", json=PAYLOAD)

    assert resposta.status_code == 503
    assert resposta.json()["detail"]["codigo"] == "COTA_IA_ESGOTADA"
    assert resposta.json()["detail"]["mensagem"]
    assert "HTTP 429" in caplog.text
    assert CHAVE not in logs_texto(caplog)


def test_500_vira_502_e_loga_corpo_truncado_sem_chave(caplog):
    caplog.set_level(logging.DEBUG)
    corpo = f"erro interno key={CHAVE} " + "x" * 1000
    client, _ = criar_app(CHAVE, lambda r: httpx.Response(500, text=corpo))

    resposta = client.post("/atividade/gerar", json=PAYLOAD)

    assert resposta.status_code == 502
    registro = next(r for r in caplog.records if "HTTP 500" in r.getMessage())
    corpo_logado = registro.args[1]
    assert len(corpo_logado) <= 300
    assert "key=***" in corpo_logado
    assert CHAVE not in logs_texto(caplog)


def test_chave_invalida_400_nao_aparece_nos_logs(caplog):
    caplog.set_level(logging.DEBUG)
    corpo = f'{{"error": {{"code": 400, "message": "API key not valid: {CHAVE}"}}}}'
    client, _ = criar_app(CHAVE, lambda r: httpx.Response(400, text=corpo))

    resposta = client.post("/atividade/gerar", json=PAYLOAD)

    assert resposta.status_code == 502
    assert CHAVE not in logs_texto(caplog)


def test_falha_de_rede_nao_vaza_url_nem_chave(caplog):
    caplog.set_level(logging.DEBUG)

    def falhar(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError(f"falhou em {request.url}?key={CHAVE}", request=request)

    client, _ = criar_app(CHAVE, falhar)

    resposta = client.post("/atividade/gerar", json=PAYLOAD)

    assert resposta.status_code == 502
    assert CHAVE not in logs_texto(caplog)

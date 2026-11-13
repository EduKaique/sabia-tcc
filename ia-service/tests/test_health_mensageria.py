from fastapi.testclient import TestClient

from app.main import app, broker


def test_health_informa_rabbitmq_sem_derrubar_o_servico(monkeypatch):
    monkeypatch.setattr(broker.settings, "rabbitmq_enabled", False)
    with TestClient(app) as client:
        resposta = client.get("/health")

    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok", "rabbitmq": "DISABLED"}

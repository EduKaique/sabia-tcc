"""Logs estruturados (JSON, uma linha por evento) com a identificação da mensagem."""
import json
import logging
from datetime import datetime, timezone

CAMPOS_ESTRUTURADOS = ("messageId", "correlationId", "eventType", "tentativa", "motivo", "submissaoId")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        dados = {
            "timestamp": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "sabia-ia-service",
            "logger": record.name,
            "message": record.getMessage(),
        }
        for campo in CAMPOS_ESTRUTURADOS:
            if hasattr(record, campo):
                dados[campo] = getattr(record, campo)
        if record.exc_info:
            dados["exception"] = self.formatException(record.exc_info)
        return json.dumps(dados, ensure_ascii=False)


def configurar(logger_name: str = "sabia.mensageria", nivel: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(logger_name)
    if not any(isinstance(h.formatter, JsonFormatter) for h in logger.handlers):
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    logger.setLevel(nivel)
    return logger

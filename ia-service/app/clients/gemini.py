import logging
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
LIMITE_CORPO_LOG = 300
_PADRAO_KEY = re.compile(r"key=[^&\s\"']+", re.IGNORECASE)


class GeminiClientError(Exception):
    """Indica uma falha na comunicação ou no formato da resposta do Gemini."""


class GeminiNotConfiguredError(GeminiClientError):
    """Indica que o serviço foi iniciado sem uma chave do Gemini."""


class GeminiCotaEsgotadaError(GeminiClientError):
    """O Gemini respondeu 429: cota ou limite de requisições esgotado."""


class GeminiClient:
    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_seconds: float,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds
        # Só para testes: permite simular respostas do Gemini.
        self._transport = transport

    async def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise GeminiNotConfiguredError("GEMINI_API_KEY não configurada.")

        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "responseMimeType": "application/json",
            },
        }
        url = f"{GEMINI_BASE_URL}/{self.model}:generateContent"

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout_seconds, transport=self._transport
            ) as client:
                # A chave vai no header, nunca na URL (que aparece em logs e exceções).
                response = await client.post(
                    url,
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": self.api_key,
                    },
                    json=body,
                )
        except httpx.HTTPError as exc:
            # Mensagem própria: a do httpx pode incluir a URL.
            raise GeminiClientError(
                f"Falha de comunicação com o Gemini ({type(exc).__name__})."
            ) from None

        if response.is_error:
            logger.warning(
                "Gemini respondeu HTTP %s: %s",
                response.status_code,
                self._redigir(response.text)[:LIMITE_CORPO_LOG],
            )
            if response.status_code == 429:
                raise GeminiCotaEsgotadaError("Cota do Gemini esgotada (HTTP 429).")
            raise GeminiClientError(f"Gemini respondeu HTTP {response.status_code}.")

        try:
            return self._extract_text(response.json())
        except (ValueError, TypeError, KeyError, IndexError) as exc:
            raise GeminiClientError("Resposta do Gemini em formato inválido.") from exc

    def _redigir(self, texto: str) -> str:
        texto = _PADRAO_KEY.sub("key=***", texto)
        if self.api_key:
            texto = texto.replace(self.api_key, "***")
        return texto

    @staticmethod
    def _extract_text(response: dict[str, Any]) -> str:
        try:
            return response["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("Resposta da IA em formato inválido.") from exc

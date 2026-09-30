from typing import Any

import httpx


class GeminiClientError(Exception):
    """Indica uma falha na comunicação ou no formato da resposta do Gemini."""


class GeminiNotConfiguredError(GeminiClientError):
    """Indica que o serviço foi iniciado sem uma chave do Gemini."""


class GeminiClient:
    def __init__(self, api_key: str, model: str, timeout_seconds: float) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds

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
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    url,
                    params={"key": self.api_key},
                    headers={"Content-Type": "application/json"},
                    json=body,
                )
                response.raise_for_status()
                return self._extract_text(response.json())
        except (httpx.HTTPError, ValueError, TypeError, KeyError, IndexError) as exc:
            raise GeminiClientError("Resposta do Gemini inválida ou indisponível.") from exc

    @staticmethod
    def _extract_text(response: dict[str, Any]) -> str:
        try:
            return response["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("Resposta da IA em formato inválido.") from exc
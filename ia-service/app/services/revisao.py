import json
import re

from app.clients.gemini import GeminiClient
from app.schemas.revisao import (
    ErroRelatorioIa,
    RevisarSubmissaoRequest,
    RevisarSubmissaoResponse,
)


class RevisaoService:
    def __init__(self, gemini_client: GeminiClient) -> None:
        self.gemini_client = gemini_client

    async def revisar(self, request: RevisarSubmissaoRequest) -> RevisarSubmissaoResponse:
        generated = await self.gemini_client.generate(build_prompt(request))
        return parse_report(generated)


def parse_report(generated_text: str) -> RevisarSubmissaoResponse:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", generated_text.strip())
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Resposta da IA em formato inválido.")

    resumo = parsed.get("resumo")
    if resumo is not None and not isinstance(resumo, str):
        raise ValueError("Resposta da IA em formato inválido.")

    nota_sugerida = parsed.get("notaSugerida")
    if nota_sugerida is not None and (
        isinstance(nota_sugerida, bool) or not isinstance(nota_sugerida, (int, float))
    ):
        raise ValueError("Resposta da IA em formato inválido.")

    acertos = parsed.get("acertos", [])
    if not isinstance(acertos, list) or not all(isinstance(item, str) for item in acertos):
        raise ValueError("Resposta da IA em formato inválido.")

    erros = parsed.get("erros", [])
    if not isinstance(erros, list):
        raise ValueError("Resposta da IA em formato inválido.")

    erros_validos: list[ErroRelatorioIa] = []
    for erro in erros:
        if not isinstance(erro, dict) or not isinstance(erro.get("descricao"), str):
            raise ValueError("Resposta da IA em formato inválido.")
        severidade = erro.get("severidade")
        if severidade is not None and not isinstance(severidade, str):
            raise ValueError("Resposta da IA em formato inválido.")
        erros_validos.append(ErroRelatorioIa(descricao=erro["descricao"], severidade=severidade))

    return RevisarSubmissaoResponse(
        resumo=resumo,
        notaSugerida=nota_sugerida,
        acertos=acertos,
        erros=erros_validos,
    )


def build_prompt(request: RevisarSubmissaoRequest) -> str:
    atividade = request.atividade
    gabarito = atividade.gabaritoEstadoJson or "Não informado."
    descricao = atividade.descricao or "Não informada."

    return f"""Você é um assistente pedagógico especializado em programação visual com Blockly.

Revise a submissão de um aluno comparando-a com a atividade e o gabarito fornecidos.
Avalie a lógica, o uso dos blocos, o atendimento ao enunciado e possíveis erros de execução.
A nota sugerida deve estar entre 0 e a pontuação máxima da atividade.

ATIVIDADE:
- Título: {atividade.titulo}
- Descrição: {descricao}
- Pontuação máxima: {atividade.pontuacaoMaxima}

GABARITO EM BLOCKLY (JSON):
{gabarito}

SUBMISSÃO DO ALUNO EM BLOCKLY (JSON):
{request.submissaoEstadoJson}

Responda APENAS com um JSON neste formato:
{{
  "resumo": "...",
  "notaSugerida": 0,
  "acertos": ["..."],
  "erros": [{{"descricao": "...", "severidade": "BAIXA|MEDIA|ALTA"}}]
}}

Use listas vazias quando não houver acertos ou erros. Não invente problemas que não possam ser observados nos blocos.
"""
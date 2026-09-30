import json
import re

from app.clients.gemini import GeminiClient
from app.schemas.atividade import (
    GerarAtividadeRequest,
    GerarAtividadeResponse,
)

class AtividadeService:
    def __init__(self, gemini_client: GeminiClient) -> None:
        self.gemini_client = gemini_client

    async def gerar(self, request: GerarAtividadeRequest) -> GerarAtividadeResponse:
        generated = await self.gemini_client.generate(build_prompt(request))
        return parse_suggestion(generated)


def parse_suggestion(generated_text: str) -> GerarAtividadeResponse:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", generated_text.strip())
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Resposta da IA em formato inválido.")

    titulo = parsed.get("titulo")
    descricao = parsed.get("descricao")
    if not isinstance(titulo, str) or not isinstance(descricao, str):
        raise ValueError("Resposta da IA em formato inválido.")

    gabarito = parsed.get("gabarito_estado_json")
    gabarito_json = None
    if gabarito is not None:
        if not isinstance(gabarito, dict):
            raise ValueError("Resposta da IA em formato inválido.")
        if "languageVersion" in gabarito:
            gabarito = {"blocks": gabarito}
        gabarito_json = json.dumps(gabarito, ensure_ascii=True, separators=(",", ":"))

    return GerarAtividadeResponse(
        titulo=titulo,
        descricao=descricao,
        gabaritoEstadoJson=gabarito_json,
    )


def build_prompt(request: GerarAtividadeRequest) -> str:
    return f"""Você é um assistente pedagógico especializado em programação visual com Blockly para educação básica.

Contexto da turma:
- Tipo de atividade: {request.tipoAtividade}

O professor descreveu o seguinte objetivo pedagógico:
"{request.descricaoObjetivo}"

Com base nesse objetivo, gere titulo, descricao e gabarito_estado_json.

REGRAS para gabarito_estado_json:
- Use APENAS estes tipos de bloco: controls_if, logic_compare, logic_operation, logic_negate, logic_boolean, math_number, math_arithmetic, math_modulo, text, text_print, text_join, get_input, variables_get, variables_set, controls_repeat_ext, controls_whileUntil, controls_for
- NUNCA use controls_if com ELSE. Use dois controls_if separados com logic_negate.
- Formato: objeto com chave "blocks" contendo "languageVersion": 0 e array "blocks".
- Blocos topLevel precisam de "type", "id", "x", "y". Sequencia via "next", nao array.
- Todos os textos: apenas ASCII sem acentos.
- NUNCA use text_join. Para imprimir texto com variavel, use text_print duas vezes separadas.
- NUNCA inclua o campo "mutation" em nenhum bloco.
- Para usar variaveis, inclua no JSON raiz uma chave "variables" com array de objetos {{"name": "nomevariavel", "id": "id_unico"}}. Nos blocos variables_get e variables_set, use "fields": {{"VAR": {{"id": "id_unico"}}}}.
- O bloco logic_negate usa a entrada "BOOL" (nao "VALUE").
- Apenas blocos topLevel (sem pai) devem ter "x" e "y".
- O bloco text_print usa a entrada "TEXT" (nao "VALUE").
- O bloco get_input NAO tem entradas (inputs). Ele apenas retorna o valor digitado pelo usuario.
- Para mostrar instrucoes ao usuario, use um text_print ANTES do get_input.
- Referencias de entradas: text_print TEXT; logic_negate BOOL; logic_compare A/B; math_modulo DIVIDEND/DIVISOR; math_arithmetic A/B; controls_if IF0/DO0; variables_set VALUE; controls_for FROM/TO/BY/DO; controls_repeat_ext TIMES/DO; controls_whileUntil BOOL/DO.

Responda APENAS com este JSON (gabarito_estado_json e um objeto, nao uma string):
{{"titulo": "...", "descricao": "...", "gabarito_estado_json": {{"blocks": {{"languageVersion": 0, "blocks": [...]}}}}}}
"""
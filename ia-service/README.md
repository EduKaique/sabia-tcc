# Sabiá — Serviço de IA

Serviço FastAPI responsável exclusivamente pela geração de sugestões de atividades com Gemini.
Não possui banco de dados nem acesso ao serviço pedagógico.

## Endpoint

`POST /atividade/gerar`

```json
{
  "idTurma": 1,
  "tipoAtividade": "ATIVIDADE_TRILHA",
  "descricaoObjetivo": "Praticar repeticao e tomada de decisao"
}
```

A rota pública do sistema é `POST /api/ia/atividade/gerar`, exposta pelo API Gateway e restrita a professores. O gateway encaminha a requisição para este serviço.

`POST /submissao/revisar`

```json
{
  "atividade": {
    "titulo": "Par ou impar",
    "descricao": "Verificar se um numero e par ou impar",
    "pontuacaoMaxima": 10,
    "gabaritoEstadoJson": "{...}"
  },
  "submissaoEstadoJson": "{...}"
}
```

Retorna um relatório com `resumo`, `notaSugerida`, `acertos` e `erros`. A rota pública correspondente é `POST /api/ia/submissao/revisar`.

## Erros

Corpo no formato padrão do FastAPI (`{"detail": ...}`).

| Situação | HTTP | `detail` |
|---|---|---|
| `GEMINI_API_KEY` ausente | 503 | `"Serviço de IA temporariamente indisponível."` |
| Cota do Gemini esgotada (Gemini respondeu 429) | 503 | `{"codigo": "COTA_IA_ESGOTADA", "mensagem": "A IA atingiu o limite de uso no momento. Tente novamente mais tarde."}` |
| Outra falha do Gemini (4xx/5xx, rede, resposta inválida) | 502 | `"Serviço de IA temporariamente indisponível."` |

O código `COTA_IA_ESGOTADA` é estável: o front pode usá-lo para mostrar uma mensagem específica
(`response.data.detail.codigo`). Os demais casos continuam com `detail` em texto.

A chave do Gemini vai no header `x-goog-api-key`, nunca na URL. Em erro, o log traz só o status
HTTP e até 300 caracteres do corpo, com qualquer `key=...` e a própria chave redigidos.

## Variáveis

- `GEMINI_API_KEY`: chave obrigatória da API Gemini.
- `GEMINI_MODEL`: modelo Gemini, padrão `gemini-2.5-flash`.
- `GEMINI_TIMEOUT_SECONDS`: timeout da chamada, padrão `45`.
- `DOCS_ENABLED`: `true` liga `/docs`, `/redoc` e `/openapi.json` (desligados por padrão).

## Desenvolvimento

```bash
pip install -r requirements.txt
GEMINI_API_KEY=... uvicorn app.main:app --reload --port 8002
```

Testes:

```bash
pip install -r requirements-dev.txt
python -m pytest
```

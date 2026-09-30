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

## Variáveis

- `GEMINI_API_KEY`: chave obrigatória da API Gemini.
- `GEMINI_MODEL`: modelo Gemini, padrão `gemini-2.5-flash`.
- `GEMINI_TIMEOUT_SECONDS`: timeout da chamada, padrão `45`.

## Desenvolvimento

```bash
pip install -r requirements.txt
GEMINI_API_KEY=... uvicorn app.main:app --reload --port 8002
```

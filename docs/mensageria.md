# Mensageria (RabbitMQ)

Comunicação assíncrona entre `auth-service`, `pedagogico-service` e `ia-service` por **eventos de integração**.

## O que usa HTTP e o que usa evento

| Fica em HTTP (precisa de resposta/transação) | Vira evento (efeito posterior, tolerante a atraso) |
|---|---|
| Login e validação de JWT | Atualização de perfil do aluno → nomes denormalizados no pedagógico |
| Busca de turma por código, matrícula no 1º acesso | Submissão enviada → geração automática de revisão por IA |
| Endpoints de IA sob demanda (`/revisar` etc.) | Revisão de IA gerada → pedagógico guarda o relatório |

## Fluxos

| Routing key | Produtor | Consumidor (fila) | Efeito |
|---|---|---|---|
| `aluno.perfil-atualizado` | auth | pedagogico (`pedagogico.aluno-perfil.queue`) | Atualiza `aluno_nome` em `turma_aluno` e `submissao_avaliativa` |
| `submissao.enviada` | pedagogico | ia (`ia.submissao-revisao.queue`) | Gera revisão com Gemini |
| `submissao.revisao-ia.gerada` | ia | pedagogico (`pedagogico.revisao-ia.queue`) | Grava `relatorio_ia_pre_gerado_json` na submissão (exposto em `SubmissaoProfessorDetalheResponse`) |

Os eventos são publicados **após o commit** da transação de origem.

## Relatório de IA persistido (CRUD)

O relatório de IA de uma submissão é salvo em `submissao_avaliativa.relatorio_ia_pre_gerado_json` (um por submissão), seja gerado automaticamente pelo evento ou sob demanda pelo professor. Se já existir um relatório, o evento `submissao.revisao-ia.gerada` é ignorado.

| Método | Rota (pedagogico, professor dono da turma) | Ação |
|---|---|---|
| GET | `/api/professor/submissoes/{id}/relatorio-ia` | Lê (404 se não existir) |
| PUT | `/api/professor/submissoes/{id}/relatorio-ia` | Cria/substitui (`resumo`, `notaSugerida`, `acertos[]`, `erros[{descricao,severidade}]`) |
| DELETE | `/api/professor/submissoes/{id}/relatorio-ia` | Remove |

No front, ao gerar o relatório (`/api/ia/submissao/revisar`) o painel salva via PUT; reabrir a correção mostra o relatório salvo, com botões "Gerar novamente" e "Descartar relatório". O relatório também vem em `relatorioIaPreGeradoJson` no detalhe da submissão.

## Topologia

- Exchange `sabia.eventos` (topic, durável) e DLX `sabia.eventos.dlx` (direct, durável).
- Cada fila principal tem `x-dead-letter-exchange=sabia.eventos.dlx` e `x-dead-letter-routing-key=<fila>.dlq`, com a DLQ `<fila>.dlq` ligada ao DLX.
- Cada consumidor declara a própria fila. Se o `ia-service` nunca subiu, `submissao.enviada` fica sem rota (o produtor registra um `WARN`; o endpoint HTTP síncrono continua disponível).

## Contrato (envelope)

Independente das entidades internas; versionado por `version`.

```json
{
  "messageId": "uuid",
  "eventType": "aluno.perfil-atualizado",
  "version": 1,
  "occurredAt": "2026-11-04T14:49:21Z",
  "correlationId": "uuid",
  "producer": "auth-service",
  "payload": { "alunoId": 9001, "nomeCompleto": "Fulano" }
}
```

Os records/models dos payloads ficam em `messaging/contrato/Eventos.java` (auth e pedagogico) e `ia-service/app/messaging/contratos.py`. Cada serviço mantém sua própria cópia do contrato (sem biblioteca compartilhada).

## Confiabilidade

- **Publicação:** publisher confirms + `mandatory`; falhas e mensagens não roteáveis são logadas.
- **Ack:** manual/automático após sucesso. Consumidores usam prefetch (10 no Java, 1 no Python).
- **Retry:** em processo, com backoff exponencial (Java: 3 tentativas, 1s ×2, máx. 10s; Python: 3 tentativas, 2s ×2).
- **DLQ:** esgotadas as tentativas, a mensagem é rejeitada sem requeue e vai para `<fila>.dlq`. Mensagens malformadas vão direto para a DLQ.
- **Idempotência:** no pedagogico, a tabela `evento_consumido` (PK `consumidor:messageId`) é gravada na mesma transação do efeito. No ia-service, cache LRU em memória.
- **Limitação:** não há outbox; se o broker estiver fora após o commit, o evento é perdido (apenas logado). Há fallback via HTTP.

## Observabilidade

- Logs JSON com `messageId`, `correlationId`, `eventType` (Java: `LOGGING_STRUCTURED_FORMAT_CONSOLE=logstash`, via `LOG_FORMAT`; Python: formatter próprio).
- Health: `GET :8080/api/health`, `GET :8081/api/health`, `GET :8002/health` incluem `rabbitmq: UP | DOWN | DISABLED` (não derruba o status geral).
- Painel: <http://localhost:15672>.

## Variáveis de ambiente

| Variável | Default | Uso |
|---|---|---|
| `RABBITMQ_USER` / `RABBITMQ_PASS` | `sabia` / `sabia` | Credenciais |
| `RABBITMQ_PORT` / `RABBITMQ_MANAGEMENT_PORT` | `5672` / `15672` | Portas expostas |
| `RABBITMQ_HOST` | `rabbitmq` (compose) | Host nos serviços |
| `RABBITMQ_ENABLED` | `true` | `false` desliga a mensageria (usado em `docker-compose.prod.yml`) |
| `RABBITMQ_RETRY_MAX_ATTEMPTS` | `3` | Tentativas (Java) |
| `RABBITMQ_RETRY_INITIAL_INTERVAL` | `1000` | Intervalo inicial em ms (Java) |
| `RABBITMQ_RETRY_INITIAL_INTERVAL_SECONDS` | `2` | Intervalo inicial (ia-service) |
| `LOG_FORMAT` | `logstash` | Formato dos logs Spring |

## Como executar

```bash
docker compose up -d --build rabbitmq auth-service pedagogico-service ia-service
```

## Como testar

```bash
# Java (sem Java local, via Docker)
docker run --rm -v $PWD:/w -v $HOME/.m2:/root/.m2 -w /w/pedagogico-service eclipse-temurin:21-jdk ./mvnw -q test
docker run --rm -v $PWD:/w -v $HOME/.m2:/root/.m2 -w /w/auth-service eclipse-temurin:21-jdk ./mvnw -q test

# Python
cd ia-service && pip install -r requirements.txt -r requirements-dev.txt && python -m pytest
```

Os testes cobrem publicação, consumo, validação de envelope, idempotência, falhas/retry/DLQ e health.

**Ponta a ponta:**

1. Autenticado como aluno, `PUT /api/auth/perfil` com novo nome → o log do pedagogico mostra `Nome do aluno ... atualizado` e `turma_aluno.aluno_nome` muda.
2. `POST /api/aluno/atividades/{id}/submeter` → logs do `ia-service` (`Mensagem tratada`) e do pedagogico (`Relatório de IA registrado`); a coluna `relatorio_ia_pre_gerado_json` é preenchida.
3. Falha: publique lixo em `submissao.enviada` pelo painel → a mensagem vai para `ia.submissao-revisao.queue.dlq`.

## Reprocessar a DLQ

```bash
python3 scripts/reprocessar-dlq.py <fila>.dlq --dry-run   # lista
python3 scripts/reprocessar-dlq.py <fila>.dlq             # reenvia ao sabia.eventos com a routing key original
```

Usa a management API (`RABBITMQ_USER`/`RABBITMQ_PASS`, `--help` para opções) e preserva o `messageId`, então a idempotência evita efeitos duplicados.

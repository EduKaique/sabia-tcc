# Análise de prontidão para deploy (homologação + produção)

> Documento local, **não versionado**. Somente diagnóstico: nenhum arquivo de código, Dockerfile, compose ou configuração foi alterado.
> Base analisada: branch `main` (commit `e7989f9`), data 2026-10-28.

## Resumo executivo

O stack sobe com `docker compose up --build`, mas **do jeito que está ele é um ambiente de desenvolvimento**: o front roda `next dev`, os dois serviços Java rodam com o profile `dev` (seeds com senha `password`, `show-sql`, log DEBUG), todos os segredos têm valor default público no repositório e **todas** as portas internas (Postgres, RabbitMQ + painel, auth, pedagógico, IA, Swagger) ficam publicadas no host. Acessado de outra máquina, o front ainda aponta para `http://localhost:8000`, ou seja, para o computador do aluno.

Há **10 bloqueadores**. A maioria é configuração (compose/Dockerfile/env), não lógica de negócio. O mais grave é o `JWT_SECRET`: o pedagogico-service não o recebe pelo compose e fica sempre com o default público. Isso quebra o login assim que um segredo real for configurado e, enquanto não for, permite forjar tokens de qualquer perfil.

RabbitMQ **não participa de nenhum fluxo** hoje (só a topologia é declarada). A IA só é usada em "gerar atividade" e "revisar submissão" (professor). Os fluxos da aula funcionam sem os dois. O modo **Jogo do Robô não está em `main`**: está na branch `feat/jogo-robo`.

---

## 1. Resultado dos 19 itens

| # | Item | Status | Evidência (arquivo:linha) |
|---|---|---|---|
| 1 | Dockerfiles | **PROBLEMA** | Auth e pedagógico: multi-stage, JDK 21 → JRE 21 alpine, mas rodam como **root** e sem `EXPOSE` (`auth-service/Dockerfile:1-12`, `pedagogico-service/Dockerfile:1-12`). Web: **só o estágio `dev`**, roda `pnpm dev`, sem build de produção, sem estágio runner apesar de `output: "standalone"` (`web/Dockerfile:1-14`, `web/next.config.ts:4`), root. Gateway: `npm install` sem lockfile (copia só `package.json`, `api-gateway/Dockerfile:7-8`), roda `npm run dev` (`:15`), root. IA: single-stage `python:3.12-slim`, root (`ia-service/Dockerfile`). |
| 2 | .dockerignore | **PROBLEMA** | Só existe `web/.dockerignore` (cobre `node_modules`, `.next`, `.env*`; não cobre `.git`, mas `.git` está na raiz e fica fora do contexto). Faltam em `auth-service/` e `pedagogico-service/` (contexto leva `target/` local), `api-gateway/` e `ia-service/` (levariam `node_modules`/`venv`/`.env` se existirem). Impacto baixo porque os Dockerfiles copiam pastas específicas. |
| 3 | Compose | **PROBLEMA** | Serviços completos (`docker-compose.yml:1-139`), volumes nomeados `postgres_data`/`rabbitmq_data` (`:142-144`), `restart: unless-stopped` em todos. Healthcheck **só** em Postgres e RabbitMQ (`:15-19`, `:33-37`); nenhum serviço de aplicação tem healthcheck. `web` e `api-gateway` usam `depends_on` sem condição ou `service_started` (`:107-110`, `:133-139`). Sem rede declarada (usa a default; funciona). Sem `hostname` no RabbitMQ: o nome do nó vira o ID do container e muda a cada recriação, então o Mnesia em `rabbitmq_data` pode ficar órfão (hoje sem impacto, pois não há mensagens). `pedagogico-service` depende de `rabbitmq: service_healthy` (`:76-77`): se o Rabbit não ficar saudável, o pedagógico não sobe, embora não precise dele. |
| 4 | Portas | **PROBLEMA** | Publicadas no host: 5433 (Postgres, `:11`), 5672 e 15672 (Rabbit + painel, `:29-30`), 8080 (auth, `:65`), 8081 (pedagógico, `:86`), 8002 (IA, `:99`), 3000 (web, `:116`), 8000 (gateway, `:132`). Só 80/443 (proxy) deveriam ser públicas. Divergências: gateway tem default `3000` (`api-gateway/src/config/env.ts:2`) e `.env.example:11` sugere `GATEWAY_PORT=3000` e `NEXT_PUBLIC_API_URL=http://localhost:3000` (`:18`), ambos colidindo com o front; `auth-service/.env.example:10` sugere `SERVER_PORT=8081` (porta do pedagógico); `web/.env.example:2-7` aponta direto para 8080/8081, contornando o gateway. Nenhum Dockerfile Java tem `EXPOSE`. |
| 5 | Separação dev × prod | **PROBLEMA** | Não existe `application-prod.yml` em nenhum serviço. O default do profile é `dev` (`auth-service/.../application.yml:5`, `pedagogico-service/.../application.yml:5`) e o compose força `SPRING_PROFILES_ACTIVE: dev` (`docker-compose.yml:52`, `:82`). Não existe compose de produção nem override (`docker-compose.override.yml` está no `.gitignore:40`). Web e gateway só têm modo dev. |
| 6 | Segredos | **PROBLEMA** | Todos vêm de env, mas **todos têm default inseguro versionado**. JWT: `auth-service/.../application.yml:48`, `pedagogico-service/.../application.yml:40`, `docker-compose.yml:54,130`, `.env.example:7`; gateway com outro default, `'dev-secret-change-me'` (`api-gateway/src/config/env.ts:3`). **O compose não passa `JWT_SECRET` ao pedagogico-service** (`docker-compose.yml:78-84`), que fica sempre com o default público. Senha do Postgres `sabia` fixa no compose (`:9`, `:51`, `:81`) e nos defaults (`auth .../application.yml:9`, `pedagogico .../application.yml:9`). RabbitMQ `sabia/sabia` (`docker-compose.yml:26-27`, `pedagogico .../application.yml:14-15`). Gemini sem default (OK). `.env` está no `.gitignore:12` e nunca foi commitado (verificado no histórico). Hoje o `.env` local usa o JWT default. |
| 7 | .env.example | **PROBLEMA** | Existem 3 (`.env.example`, `auth-service/.env.example`, `web/.env.example`), mas estão desatualizados e se contradizem (ver item 4). Faltam: `CORS_ORIGINS`, `NEXT_PUBLIC_PEDAGOGICO_API_URL` (raiz), `FRONTEND_RECUPERAR_SENHA_URL` (raiz), senhas de DB/RabbitMQ, `RABBITMQ_*`. Sobram: `JWT_EXPIRES_IN` (só usado na rota `/login` morta do gateway), `NEXT_PUBLIC_AUTH_URL` (`web/.env.example:4`, `web/next.config.ts:7`, não é lido em `src/`). |
| 8 | ddl-auto | **PROBLEMA** | `update` no `application.yml` base dos dois serviços (`auth:13`, `pedagogico:18`) e no `-dev` (`:4`). Um profile `prod` sem override também cairia em `update`. Não existe Flyway/Liquibase. `update` não apaga colunas nem dados, então o risco é **drift** (constraints NOT NULL não relaxam, renomear campo cria coluna nova e a antiga fica órfã), não perda direta. Os `ALTER TABLE ... DROP NOT NULL` do seed (`auth-service/.../data.sql:10,13`) mostram isso acontecendo. O alvo `clean` do Makefile roda `docker compose down -v` (`Makefile:25-26`) e **apaga o volume do banco**. |
| 9 | Seeds | **PROBLEMA** | `spring.sql.init.mode: always` só no profile dev (`auth .../application-dev.yml:9`, `pedagogico .../application-dev.yml:9`). Fora do dev, o default do Spring para Postgres é `never`, mas o compose força `dev`. O seed cria admin/professor/alunos com senha `password` (`auth-service/.../data.sql:23-72`), um usuário com **e-mail pessoal real** (`:39`) e uma turma com código de convite fixo `SABIA1` (`pedagogico-service/.../data.sql:79`). **Não há endpoint para criar professor ou admin em `main`** (só `/api/auth/*` em `AuthController.java:51-123`), então sem seed não existe professor. Faltam um bootstrap seguro (admin inicial a partir de env) ou uma fase de criação manual via SQL. |
| 10 | URL da API no front | **PROBLEMA** | `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_PEDAGOGICO_API_URL` são passados como env de **runtime** (`docker-compose.yml:112-114`) e só funcionam porque o container roda `next dev`. Num build de produção eles são embutidos no `next build` e o Dockerfile não tem `ARG`. Defaults apontam para localhost: compose `http://localhost:8000` (`:113-114`), `web/src/lib/api.ts:4` e `web/src/lib/pedagogicoApi.ts:4` caem em `http://localhost:3000` (porta errada até no dev). `services/auth.ts:3`, `convites.ts:3` e `recuperacaoSenha.ts:1` usam `BASE` sem fallback: se faltar, vira `"undefined/api/..."`. |
| 11 | CORS | **PROBLEMA** (config) | Gateway: `CORS_ORIGINS` com default `http://localhost:8000` e `credentials: true` (`api-gateway/src/plugins/cors.ts:6-10`). Auth e pedagógico: `setAllowedOriginPatterns(CORS_ORIGINS)` (`auth .../SecurityConfig.java:66`, `pedagogico .../SecurityConfig.java:135`), default `http://localhost:3000`. O compose passa `CORS_ORIGINS` ao auth e ao gateway (`:56`, `:129`), mas não ao pedagógico. Precisa ser `https://<domínio>`. Com proxy de mesma origem (front e `/api` no mesmo host), CORS deixa de ser exercitado pelo browser. |
| 12 | Cookies/token | **PROBLEMA** (melhoria) | JWT em `localStorage` (`web/src/lib/auth-helpers.ts:6`) e no cookie `sabia_token` via js-cookie: não HttpOnly (impossível via JS), `SameSite=Strict`, `Secure` só se `NODE_ENV=production` (`:8-12`), o que nunca acontece com `next dev`. O cookie só serve ao redirect de `/login` (`web/src/proxy.ts`, que substituiu `middleware.ts`). Risco: XSS rouba o token, e há HTML não sanitizado da descrição da atividade renderizado para o aluno (`components/aluno/atividades/PainelDetalhe.tsx:49`, `components/aluno/editor/SidebarInstrucoes.tsx:31`). Em HTTP puro, `navigator.clipboard` não funciona, o que quebra o "copiar link de convite" (`components/professor/turmas/TurmaFormDialog.tsx:84`). **HTTPS é necessário.** Validade do token: 8 h (`JWT_EXPIRATION_MS=28800000`). |
| 13 | Reverse proxy | **PROBLEMA** | Não existe. O browser fala com 3000 (web) e 8000 (gateway) separadamente. Recomendo Caddy (HTTPS automático) como único ponto público: `/api/*` → gateway, resto → web. |
| 14 | Endpoints expostos | **PROBLEMA** | Swagger público nos dois serviços Java (`springdoc` nos poms; liberado em `auth .../SecurityConfig.java:39-41`, `pedagogico .../SecurityConfig.java:108-110`), acessível pelas portas publicadas 8080/8081. FastAPI `/docs` e `/openapi.json` no 8002. **ia-service não tem autenticação**: na porta 8002 qualquer um chama o Gemini com a chave do projeto. `/api/interno/**` do pedagógico fica acessível direto na 8081 (o gateway bloqueia, mas a porta está aberta) e, com o JWT default, dá para forjar um token `SISTEMA`. `show-sql: true` no base (`auth .../application.yml:14`, `pedagogico:19`), DEBUG em `org.springframework.web` (`application-dev.yml:13-14`), `include-message: always` (`:21`/`:25`). Gateway: rota `POST /login` morta (chama `${AUTH_URL}/login`, que não existe) com `console.log(auth)` (`api-gateway/src/routes/auth.ts:12-30`). Painel RabbitMQ 15672 e Postgres 5433 com `sabia/sabia`. Actuator e h2-console: N/A (não estão no classpath de runtime). |
| 15 | Backup/restore | **PROBLEMA** | Nada implementado. Dados só no volume `postgres_data`. Falta: `pg_dump` agendado (um banco, dois schemas), cópia para fora do servidor, retenção e um teste de restore documentado. RabbitMQ não precisa de backup hoje. |
| 16 | Logs/diagnóstico | **PROBLEMA** | Logs em stdout (`docker compose logs`). Sem rotação configurada (driver `json-file` sem `max-size`), e com `show-sql` + DEBUG o disco enche. Health: auth `GET /api/health` (`HealthController.java:14`), gateway `GET /health` (estático, não testa upstreams, `api-gateway/src/routes/health.ts`), IA `GET /health`; **pedagógico não tem** (sem actuator). O gateway gera `x-request-id` (`hooks/request-headers.ts`), mas os serviços não o logam (nenhum MDC). |
| 17 | Recursos | **PROBLEMA** | Sem `mem_limit`/`deploy.resources` e sem flags JVM (`JAVA_OPTS`/`-Xmx` ausentes). A JVM em container usa `MaxRAMPercentage=25%` da RAM **do host** por serviço. `next dev` sozinho pode passar de 1 GB. Estimativa na seção 4. |
| 18 | Gemini | **OK parcial** | Timeout 45 s configurável (`ia-service/app/clients/gemini.py:118`), chave ausente vira 503 e outras falhas viram 502 com mensagem genérica (`routes/atividade.py:153-163`, `routes/revisao.py`). Sem retry/backoff; 429 (cota) é indistinguível de outras falhas. A chave vai na query string (`gemini.py:121`) e `logger.exception("...%s", exc)` registra a mensagem do `httpx.HTTPStatusError`, que inclui a URL completa: **a chave vaza nos logs** quando o Gemini responde erro. Sem limite de uso por professor. Porta 8002 aberta sem auth (item 14). |
| 19 | Fluxos sem RabbitMQ/IA | **OK** (com ressalvas) | RabbitMQ: nenhum `RabbitTemplate.convertAndSend` no código; só a topologia, com tolerância a falha (`RabbitMQConfig.java:200-209`). Ressalva: dependência `service_healthy` no compose (item 3). IA: só "gerar atividade" e "revisar submissão"; a correção do professor é manual (`ProfessorSubmissaoController`, `web/src/services/submissoes.ts:26-31`). Primeiro acesso por código depende de auth → pedagógico (`auth-service/.../client/PedagogicoClient.java`, timeout 2 s/5 s) **com o mesmo JWT_SECRET** (ver B1). Blockly roda no browser. **Jogo do Robô não está em `main`**: está em `feat/jogo-robo` (1 commit, 29 arquivos, não mergeado). `next/font/google` (`app/layout.tsx:2`, `lib/fontesHome.ts:1`) precisa de internet no build (e no `next dev`, em runtime). |

---

## 2. Bloqueadores × melhorias

### Bloqueadores (impedem subir com segurança/funcionando)

| ID | Bloqueador | Itens |
|---|---|---|
| **B1** | `JWT_SECRET` não é passado ao pedagogico-service no compose. Com um segredo real, todo acesso ao pedagógico dá 401 (inclusive o primeiro acesso). Com o default, qualquer pessoa forja tokens (`PROFESSOR`, `SISTEMA`…). | 6, 19 |
| **B2** | Front aponta para `localhost` e roda `next dev`. Falta build de produção com `NEXT_PUBLIC_*` como `ARG` e `next start`/standalone. | 1, 10 |
| **B3** | Portas internas publicadas no host (5433, 5672, 15672, 8080, 8081, 8002, 3000, 8000) com credenciais `sabia/sabia` e IA sem autenticação. | 4, 14 |
| **B4** | Sem reverse proxy/HTTPS. Clipboard falha em HTTP, o token trafega em claro e a rede da escola pode bloquear portas altas. | 12, 13 |
| **B5** | Sem profile de produção: compose força `dev` (seeds com senha `password`, e-mail pessoal real, convite `SABIA1`, DEBUG, `show-sql`). | 5, 9, 14 |
| **B6** | Sem forma de criar o primeiro professor/admin fora do seed (nenhum endpoint em `main`). | 9 |
| **B7** | Segredos com default inseguro em todo lugar (DB, RabbitMQ, JWT em 3 valores distintos). Falta exigir env obrigatório e falhar no startup sem ele. | 6, 7 |
| **B8** | Sem backup do Postgres antes de usar com uma turma real (e `make clean` apaga o volume). | 8, 15 |
| **B9** | Chave do Gemini vaza em log quando a API retorna erro (por exemplo, cota estourada). | 18 |
| **B10** | Jogo do Robô não está em `main`. Se ele faz parte da aula, precisa ser mergeado e homologado antes. | 19 |

### Melhorias recomendadas (não impedem)

- Usuário não-root em todas as imagens; `EXPOSE` nos Dockerfiles Java; lockfile no build do gateway (`npm ci`).
- `.dockerignore` em `auth-service`, `pedagogico-service`, `api-gateway`, `ia-service`.
- Healthchecks nos serviços de aplicação e `depends_on: condition: service_healthy`; health do gateway checando upstreams; endpoint de health no pedagógico (ou actuator só com `health`).
- Remover `depends_on rabbitmq: service_healthy` do pedagógico, ou nem subir o RabbitMQ enquanto ele não for usado (economiza cerca de 200 MB).
- `hostname: rabbitmq` fixo no compose, se o Rabbit for mantido.
- Desligar Swagger/`/docs` em prod (`springdoc.api-docs.enabled=false`, `FastAPI(docs_url=None)`).
- `show-sql: false` e `include-message: never` no base; log INFO em prod.
- Rotação de logs do Docker (`max-size`, `max-file`).
- Limites de memória e `-XX:MaxRAMPercentage=75` com `mem_limit` por container.
- Logar `x-request-id` (MDC) nos serviços Java.
- Remover a rota morta `POST /login` do gateway e o `console.log`.
- Sanitizar o HTML da descrição da atividade antes do `dangerouslySetInnerHTML`.
- Flyway/Liquibase no lugar de `ddl-auto: update` (pós-TCC); em prod, no mínimo `validate` depois da primeira subida.
- Mandar a chave do Gemini no header `x-goog-api-key` e distinguir 429 com a mensagem "cota da IA esgotada" no front.
- Atualizar os `.env.example` e os docs desatualizados (`README.md`, `docs/setup.md`, `docs/architecture.md`, `auth-service/README.md`, `pom.xml`/`Makefile` raiz citando `api/`).
- `FRONTEND_RECUPERAR_SENHA_URL` e SMTP reais se a recuperação de senha for usada; senão, com `EMAIL_PROVIDER=dev`, o link só aparece no log do auth-service (dá para usar como contingência na aula).
- `JWT_EXPIRATION_MS`: 8 h cobre a aula; avaliar se basta.

---

## 3. Variáveis de ambiente por serviço

> Exemplos sem valor real. "Obrig." = obrigatória em produção (hoje quase todas têm default; a proposta é que deixem de ter).

### database (postgres:16)
| Variável | Obrig. | Exemplo |
|---|---|---|
| `POSTGRES_DB` | sim | `sabia` |
| `POSTGRES_USER` | sim | `sabia` |
| `POSTGRES_PASSWORD` | sim | `<senha-forte-gerada>` |

### rabbitmq (opcional enquanto não houver uso)
| Variável | Obrig. | Exemplo |
|---|---|---|
| `RABBITMQ_DEFAULT_USER` | sim* | `sabia` |
| `RABBITMQ_DEFAULT_PASS` | sim* | `<senha-forte-gerada>` |

### auth-service
| Variável | Obrig. | Exemplo |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | sim | `prod` |
| `SPRING_DATASOURCE_URL` | sim | `jdbc:postgresql://database:5432/sabia?currentSchema=auth` |
| `SPRING_DATASOURCE_USERNAME` | sim | `sabia` |
| `SPRING_DATASOURCE_PASSWORD` | sim | `<mesma do Postgres>` |
| `SERVER_PORT` | não | `8080` |
| `JWT_SECRET` | **sim** | `<≥32 bytes aleatórios, igual em auth/pedagógico/gateway>` |
| `JWT_EXPIRATION_MS` | não | `28800000` |
| `CORS_ORIGINS` | sim | `https://sabia.<universidade>.br` |
| `PEDAGOGICO_URL` | não | `http://pedagogico-service:8081` |
| `FRONTEND_RECUPERAR_SENHA_URL` | sim | `https://sabia.<universidade>.br/redefinir-senha` |
| `EMAIL_PROVIDER` | não | `dev` ou `smtp` |
| `EMAIL_FROM` | se smtp | `no-reply@<dominio>` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | se smtp | `<host>` / `587` / `<usuario>` / `<senha>` |

### pedagogico-service
| Variável | Obrig. | Exemplo |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | sim | `prod` |
| `SPRING_DATASOURCE_URL` (ou `DB_URL`) | sim | `jdbc:postgresql://database:5432/sabia?currentSchema=pedagogico` |
| `SPRING_DATASOURCE_USERNAME` (ou `DB_USER`) | sim | `sabia` |
| `SPRING_DATASOURCE_PASSWORD` (ou `DB_PASS`) | sim | `<mesma do Postgres>` |
| `SERVER_PORT` | não | `8081` |
| `JWT_SECRET` | **sim (hoje ausente no compose)** | `<igual ao auth>` |
| `JWT_EXPIRATION_MS` | não | `28800000` |
| `CORS_ORIGINS` | sim | `https://sabia.<universidade>.br` |
| `RABBITMQ_HOST` / `RABBITMQ_PORT` | se Rabbit | `rabbitmq` / `5672` |
| `RABBITMQ_USER` / `RABBITMQ_PASS` | se Rabbit | `sabia` / `<senha>` |

> Obs.: o `application.yml` do pedagógico lê `DB_URL/DB_USER/DB_PASS`. O compose usa `SPRING_DATASOURCE_*`, que funciona por precedência do Spring, mas os dois nomes convivem. Vale padronizar.

### api-gateway
| Variável | Obrig. | Exemplo |
|---|---|---|
| `GATEWAY_PORT` | sim | `8000` |
| `JWT_SECRET` | **sim** | `<igual ao auth>` |
| `AUTH_URL` | sim | `http://auth-service:8080` |
| `PEDAGOGICO_URL` | sim | `http://pedagogico-service:8081` |
| `IA_URL` | sim | `http://ia-service:8002` |
| `CORS_ORIGINS` | sim | `https://sabia.<universidade>.br` |
| `JWT_EXPIRES_IN` | não (rota morta) | `1h` |

### ia-service
| Variável | Obrig. | Exemplo |
|---|---|---|
| `GEMINI_API_KEY` | sim (sem ela: 503) | `<chave do Google AI Studio>` |
| `GEMINI_MODEL` | não | `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_SECONDS` | não | `45` |

### web (build time: precisam ser `ARG` no Dockerfile)
| Variável | Obrig. | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | sim | `https://sabia.<universidade>.br` (ou `""` para caminhos relativos atrás do proxy) |
| `NEXT_PUBLIC_PEDAGOGICO_API_URL` | sim | `https://sabia.<universidade>.br/api/pedagogico` |
| `NEXT_PUBLIC_AUTH_URL` | não (não usada) | — |

---

## 4. Proposta de arquitetura de deploy

```
Internet / rede da escola
          │  80/443 (únicas portas públicas)
     ┌────▼─────┐
     │  Caddy   │  TLS automático (Let's Encrypt) ou certificado da universidade
     └─┬──────┬─┘
  /api/*      │ /* (resto)
       │      └──────────────► web (next start / standalone) :3000
       ▼
  api-gateway :8000 ──┬─ /api/auth/**       → auth-service :8080
                      ├─ /api/publico/**    → pedagogico-service :8081
                      ├─ /api/pedagogico/** → pedagogico-service :8081
                      └─ /api/ia/**         → ia-service :8002 ──► Gemini (egress HTTPS)
  auth-service ──(interno, token SISTEMA)──► pedagogico-service
  auth-service, pedagogico-service ──► database :5432
  [rabbitmq :5672 — opcional, hoje sem uso]
```

- **Rede:** uma rede Docker interna (`backend`). Só o Caddy publica `80:80` e `443:443`. Os demais ficam sem `ports:` (no máximo `127.0.0.1:5433:5432` para manutenção via túnel SSH).
- **Mesma origem:** front e API sob o mesmo domínio. O CORS deixa de ser exercitado, o cookie `SameSite=Strict` funciona e `NEXT_PUBLIC_API_URL` pode ser o próprio domínio.
- **Arquivos:** `docker-compose.yml` (base) + `docker-compose.prod.yml` (sem portas, profile `prod`, limites, logging, Caddy). `.env` no servidor com `chmod 600`, fora do git.
- **Painel RabbitMQ:** se mantido, só via túnel SSH (`ssh -L 15672:localhost:15672`).

### Estimativa de RAM (produção, ~30 alunos simultâneos)

| Container | RAM típica | Limite sugerido |
|---|---|---|
| Caddy | 20–40 MB | 64 MB |
| web (next start) | 150–300 MB | 512 MB |
| api-gateway (Node) | 60–120 MB | 256 MB |
| auth-service (JVM) | 300–450 MB | 640 MB (`MaxRAMPercentage=75`) |
| pedagogico-service (JVM) | 300–500 MB | 768 MB |
| ia-service (uvicorn) | 60–100 MB | 256 MB |
| Postgres | 100–250 MB | 512 MB |
| RabbitMQ (opcional) | 130–250 MB | 384 MB |
| **Total** | **~1,2–2,0 GB** | **~3,4 GB** |

Mínimo recomendado no servidor: **4 GB de RAM e 2 vCPU** (o build das imagens Java e Next no próprio servidor consome mais: 1,5–2 GB de pico só no `next build`). Com o `next dev` atual, some 1 GB ou mais.

---

## 5. Ordem sugerida de correções (uma issue candidata por bloqueador)

| Ordem | Issue candidata | Bloqueador | Resumo do que fazer |
|---|---|---|---|
| 1 | `fix(deploy): passar JWT_SECRET (e CORS_ORIGINS) ao pedagogico-service no compose` | B1 | Adicionar as variáveis ao serviço e testar o primeiro acesso + uma chamada do professor com um segredo não-default. |
| 2 | `chore(deploy): exigir segredos sem default em produção` | B7 | Tirar os defaults de JWT/DB/Rabbit no profile prod (ou validar no startup: falhar se o JWT for o default ou tiver menos de 32 bytes); unificar o default do gateway; atualizar os `.env.example`. |
| 3 | `chore(deploy): profile prod para auth e pedagógico` | B5 | Criar `application-prod.yml` com `sql.init.mode: never`, `show-sql: false`, log INFO, springdoc desligado e `include-message: never`. |
| 4 | `feat(auth): bootstrap seguro do primeiro admin/professor` | B6 | Por exemplo, um `ApplicationRunner` no profile prod que cria o admin a partir de `SABIA_ADMIN_EMAIL`/`SABIA_ADMIN_SENHA` se não existir, ou um script SQL de provisionamento documentado. Também decidir como cadastrar os professores da aula (a branch `feat/s4-admin-professores` existe e não está mergeada). |
| 5 | `chore(web): Dockerfile de produção (build + standalone) com NEXT_PUBLIC_* como ARG` | B2 | Estágios `deps` → `build` (`ARG NEXT_PUBLIC_*`) → `runner` (`node server.js`, usuário `nextjs`); corrigir os fallbacks localhost de `api.ts`/`pedagogicoApi.ts`. |
| 6 | `chore(deploy): docker-compose.prod.yml com Caddy, sem portas internas publicadas` | B3, B4 | Caddyfile (`/api/*` → gateway, resto → web), remover `ports:` dos demais, limites de memória, rotação de logs, healthchecks. |
| 7 | `fix(ia): não vazar GEMINI_API_KEY em logs` | B9 | Chave no header `x-goog-api-key`; logar status e corpo, não a URL. |
| 8 | `chore(ops): rotina de backup/restore do Postgres` | B8 | `pg_dump` diário via cron no host para um diretório fora do volume e cópia externa; restore testado em homologação. |
| 9 | `feat: merge do Jogo do Robô em main + homologação` | B10 | Só se fizer parte da aula. Revisar `feat/jogo-robo` e mergear antes de congelar a versão. |

Depois dos bloqueadores: as melhorias da seção 2, em especial os healthchecks e a remoção da dependência obrigatória do RabbitMQ.

---

## 6. Checklist de homologação manual (smoke test pós-deploy)

**Infra**
- [ ] `docker compose ps`: todos `running`/`healthy`, nenhum reiniciando em loop.
- [ ] De **outra máquina**: só 80/443 respondem (`nmap` ou `curl` em 5433, 5672, 15672, 8000, 8002, 8080, 8081 → recusado).
- [ ] `https://<domínio>` com certificado válido; `http://` redireciona para `https://`.
- [ ] `curl https://<domínio>/api/health` (gateway) e o health de cada serviço pela rede interna (`docker compose exec`).
- [ ] Logs sem `show-sql`, sem DEBUG e sem segredo (`docker compose logs | grep -i -E 'key=|secret|password'`).
- [ ] Swagger e `/docs` inacessíveis externamente.
- [ ] `docker stats`: consumo dentro dos limites com o sistema ocioso.

**Segurança**
- [ ] Login com `admin@sabia.edu` / `password` **falha** (seed desligado).
- [ ] Token forjado com o secret default → 401 no `/api/pedagogico/...`.
- [ ] `/api/pedagogico/api/interno/...` → 404 pelo gateway.

**Fluxos da aula** (em um notebook/Chromebook da escola, na rede da escola)
- [ ] Professor faz login, cria uma turma e copia o link de convite (clipboard funciona em HTTPS).
- [ ] Professor cria uma atividade (blocos) e publica.
- [ ] (Se mergeado) Professor cria uma atividade no modo Jogo do Robô.
- [ ] Aluno abre `/convite/<codigo>`, faz o primeiro acesso, define a senha e entra na turma.
- [ ] Aluno faz logout e login de novo pela matrícula.
- [ ] Aluno abre a atividade e o editor Blockly carrega (fontes e toolbox ok); executa e envia a submissão.
- [ ] Professor vê a submissão, corrige e lança a nota; o aluno vê a nota.
- [ ] Professor usa "gerar atividade com IA" e "revisar com IA" (com chave válida).
- [ ] **Degradação:** `docker compose stop ia-service` → o professor vê erro amigável e todo o resto funciona. `docker compose stop rabbitmq` → nada muda para o usuário.
- [ ] Recuperar senha: o link chega (SMTP) ou aparece no log do auth-service (`EMAIL_PROVIDER=dev`), e o domínio do link está correto.
- [ ] Carga leve: 5–10 abas de aluno simultâneas sem erro e com tempos aceitáveis.

**Operação**
- [ ] O backup roda e gera arquivo; o restore em base vazia funciona.
- [ ] `docker compose restart` de cada serviço: o sistema volta sozinho e os dados persistem.
- [ ] Reboot do servidor: o stack sobe sozinho (`restart: unless-stopped` + Docker habilitado no systemd).

---

## 7. Perguntas em aberto (dependem do servidor da universidade)

1. **Recursos:** quanta RAM/CPU/disco? É VM dedicada ou compartilhada? (abaixo de 4 GB, fazer o build fora do servidor e só puxar as imagens)
2. **Docker:** Docker Engine + Compose v2 instalados? Temos `sudo` ou estamos no grupo `docker`?
3. **Rede de entrada:** o servidor tem IP público ou só intranet? A escola acessa pela internet ou por VPN? Quais portas o firewall da universidade libera (80/443?)
4. **DNS e TLS:** haverá um (sub)domínio, como `sabia.<universidade>.br`? Let's Encrypt (precisa da 80 aberta para a internet) ou certificado institucional?
5. **Saída para a internet:** o servidor acessa `generativelanguage.googleapis.com`, Docker Hub, Maven Central, npm e Google Fonts? Há proxy HTTP obrigatório? (afeta build, `next/font` e Gemini)
6. **Rede da escola:** há filtro de conteúdo que bloqueie o domínio, portas ou WebSocket? Quantos alunos e dispositivos (Chromebook? navegador?) e qual a banda?
7. **SMTP:** existe relay institucional para a recuperação de senha, ou fica `EMAIL_PROVIDER=dev`?
8. **Backup:** existe política/armazenamento de backup da universidade para onde copiar o dump?
9. **Dados pessoais (LGPD):** nomes/CPF/matrícula de alunos menores serão cadastrados? É preciso termo/autorização e prazo de retenção e exclusão após o TCC?
10. **Homologação e produção:** mesmo servidor (dois stacks/domínios) ou servidores diferentes? Os dados de homologação precisam ir para produção?
11. **Gemini:** a chave é de conta gratuita (limites baixos por minuto) ou paga? Quantos professores vão usar a IA ao mesmo tempo?
12. **Acesso e manutenção:** quem tem SSH, e o acesso continua durante a aula para diagnóstico? Há monitoramento institucional?

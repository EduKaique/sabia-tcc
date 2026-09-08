# Sabiá — Serviço de Autenticação (`auth-service`)

Microsserviço de **IAM & Perfis**: autentica usuários (Aluno, Professor, Administrador),
emite o token JWT da plataforma e expõe os dados da sessão. É o **único emissor** de token
do Sabiá — os demais serviços e o API Gateway apenas **validam**.

| | |
|---|---|
| Stack | Java 21 · Spring Boot 4 · Spring Security · Spring Data JPA |
| Porta | `8081` |
| Banco | PostgreSQL — **Auth DB** (`sabia_auth`), isolado do monólito |
| Docs | `http://localhost:8081/swagger-ui.html` |

## Rodar localmente

```bash
# 1. Auth DB (via compose, na raiz do repo)
docker compose up -d auth-db

# 2. serviço
cd auth-service
./mvnw spring-boot:run
```

Seed de desenvolvimento (`src/main/resources/data.sql`) — senha de todos: `password`

| E-mail | Perfil |
|---|---|
| `admin@sabia.edu` | ADMINISTRADOR |
| `professor@sabia.edu` | PROFESSOR |
| `aluno@sabia.edu` | ALUNO |

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/login` | pública | Valida credenciais e retorna JWT |
| `GET` | `/api/auth/me` | Bearer | Usuário autenticado a partir do token |
| `POST` | `/api/auth/validate` | pública | Verifica assinatura/validade de um token (uso do Gateway) |
| `GET` | `/api/health` | pública | Health check |

### `POST /api/auth/login`
```jsonc
// 200
{ "token": "eyJ...", "tipo": "Bearer", "perfil": "PROFESSOR", "nome": "Ana Professora" }
// 401 — mensagem genérica (não revela qual campo falhou)
{ "status": 401, "erro": "E-mail ou senha incorretos", "timestamp": "..." }
```

### `GET /api/auth/me`
```jsonc
// 200
{ "id": 2, "nome": "Ana Professora", "email": "professor@sabia.edu", "perfil": "PROFESSOR" }
```

---

## Contrato de validação de token para o API Gateway

O token é um **JWT HS256**. Estrutura das claims:

| Claim | Conteúdo |
|---|---|
| `sub` | id do usuário (numérico, como string) |
| `perfil` | `ADMINISTRADOR` \| `PROFESSOR` \| `ALUNO` |
| `nome` | nome do usuário |
| `iat` / `exp` | emissão / expiração (padrão: 8h — `JWT_EXPIRATION_MS`) |

O header enviado pelos clientes é `Authorization: Bearer <token>`.

### Opção A — segredo HMAC compartilhado (recomendada, padrão)

Todos os serviços e o Gateway compartilham a variável **`JWT_SECRET`** (a mesma string,
≥ 32 bytes). O Gateway valida o token **localmente**, sem chamar o `auth-service`:

1. extrai o token do header `Authorization`;
2. verifica a assinatura HS256 com `JWT_SECRET`;
3. rejeita com **401** se assinatura inválida ou `exp` no passado;
4. repassa a requisição adicionando headers de identidade para os serviços downstream:
   `X-User-Id: <sub>`, `X-User-Perfil: <perfil>`.

> O `auth-service` e o monólito `api/` já usam exatamente esse esquema
> (`sabia.jwt.secret` / env `JWT_SECRET`). Basta o Gateway usar o mesmo valor.

### Opção B — introspecção via `POST /api/auth/validate`

Para o Gateway que prefira não conhecer o segredo:

```jsonc
// POST /api/auth/validate   (body)
{ "token": "eyJ..." }

// 200 — token válido
{ "valido": true, "usuarioId": 2, "perfil": "PROFESSOR", "nome": "Ana Professora",
  "expiraEm": "2026-09-09T02:00:00Z" }

// 200 — token inválido/expirado (nunca lança erro)
{ "valido": false, "usuarioId": null, "perfil": null, "nome": null, "expiraEm": null }
```

Custa uma chamada de rede por requisição — recomenda-se cache curto (TTL ≤ 60s) no Gateway.

### Rotas públicas (não exigem token, o Gateway deve deixar passar)
`/api/auth/login`, `/api/auth/validate`, `/api/auth/esqueci-senha`*, `/api/auth/redefinir-senha`*, `/api/health`, `/swagger-ui/**`, `/v3/api-docs/**`

\* implementadas na issue #17.

---

## Variáveis de ambiente

Ver [`.env.example`](.env.example). As essenciais:

| Var | Default (dev) | Observação |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5433/sabia_auth` | Auth DB |
| `JWT_SECRET` | `dev-secret-change-in-production-must-be-at-least-32-chars` | **igual** no Gateway e demais serviços |
| `JWT_EXPIRATION_MS` | `28800000` (8h) | |
| `SERVER_PORT` | `8081` | |

## Testes

```bash
./mvnw verify
```

Usa H2 em memória (perfil `test`) — não precisa de PostgreSQL.

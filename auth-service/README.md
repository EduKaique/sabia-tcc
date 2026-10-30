# Sabiá — Serviço de Autenticação (`auth-service`)

Microsserviço de **IAM & Perfis**: autentica usuários (Aluno, Professor, Administrador),
emite o token JWT da plataforma e expõe os dados da sessão. É o **único emissor** de token
do Sabiá — os demais serviços e o API Gateway apenas **validam**.

| | |
|---|---|
| Stack | Java 21 · Spring Boot 4 · Spring Security · Spring Data JPA |
| Porta | `8080` |
| Banco | PostgreSQL — **Auth DB** (`sabia_auth`), isolado do monólito |
| Docs | `http://localhost:8080/swagger-ui.html` |

## Rodar localmente

```bash
# Banco compartilhado (via compose, na raiz do repo)
docker compose up -d database

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
| `POST` | `/api/auth/esqueci-senha` | pública | Gera um token de recuperação (24h) e envia o link por e-mail |
| `POST` | `/api/auth/redefinir-senha` | pública | Redefine a senha a partir de um token de recuperação válido |
| `POST` | `/api/auth/trocar-senha` | Bearer | Troca obrigatória de senha (quando `mustChangePassword=true`) |
| `PUT` | `/api/auth/perfil` | Bearer | Aluno completa o perfil (nome, CPF, matrícula, avatar) |
| `GET` | `/api/auth/perfil/status` | Bearer | `{ perfilCompleto }` do usuário autenticado |
| `GET` | `/api/admin/professores` | Bearer (ADMINISTRADOR) | Lista professores, com filtro opcional `?ativo=true\|false` |
| `POST` | `/api/admin/professores` | Bearer (ADMINISTRADOR) | Cadastra professor com senha temporária (e-mail mock em dev) |
| `PATCH` | `/api/admin/professores/{id}/desativar` | Bearer (ADMINISTRADOR) | Soft delete — bloqueia login e derruba sessões ativas na hora |
| `PATCH` | `/api/admin/professores/{id}/reativar` | Bearer (ADMINISTRADOR) | Devolve o acesso do professor |
| `GET` | `/api/health` | pública | Health check |

### `POST /api/auth/login`
```jsonc
// 200
{ "token": "eyJ...", "tipo": "Bearer", "role": "PROFESSOR", "nome": "Ana Professora", "mustChangePassword": false }
// 401 — mensagem genérica (não revela qual campo falhou)
{ "status": 401, "erro": "E-mail ou senha incorretos", "timestamp": "..." }

// 403 — credenciais corretas, mas a conta foi desativada pelo admin
{ "status": 403, "erro": "Usuário inativo.", "timestamp": "..." }
```
Se `mustChangePassword=true` (ex.: senha gerada pelo admin), o front deve barrar o acesso ao
dashboard e forçar a chamada de `POST /api/auth/trocar-senha` antes de liberar o resto da app.

### `GET /api/auth/me`
```jsonc
// 200
{ "id": 2, "nome": "Ana Professora", "email": "professor@sabia.edu", "role": "PROFESSOR" }
```

### `POST /api/auth/esqueci-senha`
```jsonc
// body
{ "email": "professor@sabia.edu" }

// 200 — sempre a mesma resposta, exista ou não o e-mail (não revela se o e-mail está cadastrado)
{ "mensagem": "Se o e-mail informado estiver cadastrado, você receberá as instruções de recuperação em instantes." }
```
Se o e-mail existir, gera um token de recuperação válido por **24h** e chama o `EmailService`
(implementação `dev`: apenas `log.info` com o link; implementação `smtp`: envia de verdade via
`SmtpEmailService` — escolhida por `sabia.email.provider`/`EMAIL_PROVIDER`). O link segue o
formato `{sabia.frontend.recuperar-senha-url}?token={token}`.

### `POST /api/auth/redefinir-senha`
```jsonc
// body
{ "token": "...", "novaSenha": "novaSenha123", "confirmarSenha": "novaSenha123" }

// 200
{ "mensagem": "Senha redefinida com sucesso." }

// 422 — senhas divergentes ou token inexistente
{ "status": 422, "erro": "As senhas não coincidem.", "timestamp": "..." }
{ "status": 422, "erro": "Link inválido.", "timestamp": "..." }

// 410 — token expirado ou já usado
{ "status": 410, "erro": "Este link expirou.", "timestamp": "..." }
{ "status": 410, "erro": "Este link já foi utilizado.", "timestamp": "..." }
```
Ao redefinir com sucesso: grava a nova senha com BCrypt, marca o token usado (invalidando-o
na hora) e invalida também os demais tokens de recuperação ativos do mesmo usuário.

### `POST /api/auth/trocar-senha` (Bearer)
```jsonc
// body
{ "senhaAtual": "senhaTemporaria", "novaSenha": "novaSenha123", "confirmarSenha": "novaSenha123" }

// 200
{ "mensagem": "Senha alterada com sucesso." }

// 401 — senha atual incorreta
{ "status": 401, "erro": "Senha atual incorreta.", "timestamp": "..." }

// 422 — senhas divergentes
{ "status": 422, "erro": "As senhas não coincidem.", "timestamp": "..." }
```
Grava a nova senha com BCrypt e zera `mustChangePassword`.

### `PUT /api/auth/perfil` (Bearer, apenas ALUNO)
```jsonc
// body
{ "nomeCompleto": "Carlos Aluno", "cpf": "98765432100", "matricula": "2026001", "avatar": "avatar-1.png" }

// 200
{ "mensagem": "Perfil atualizado com sucesso." }

// 403 — usuário autenticado não é ALUNO
{ "status": 403, "erro": "Esse recurso é exclusivo para alunos.", "timestamp": "..." }

// 409 — CPF ou matrícula já usados por outro usuário
{ "status": 409, "erro": "CPF já cadastrado.", "timestamp": "..." }
{ "status": 409, "erro": "Matrícula já cadastrada.", "timestamp": "..." }
```
Atualiza `Usuario.nome`/`cpf` e `Aluno.matricula`/`avatar`, e marca `Aluno.perfilCompleto = true`.
O passo "ingressar na turma por código" (HU003) e o status `temTurma` ficam no Serviço
Pedagógico — o front combina os dois status antes de liberar o dashboard do aluno.

### `GET /api/auth/perfil/status` (Bearer)
```jsonc
// 200
{ "perfilCompleto": false }
```
Para PROFESSOR/ADMINISTRADOR sempre retorna `perfilCompleto: true` (não há perfil a completar).

### `GET /api/admin/professores` (Bearer, apenas ADMINISTRADOR)
```jsonc
// GET /api/admin/professores?ativo=true   (o filtro é opcional; sem ele, lista todos)

// 200
[ { "id": 2, "nome": "Ana Professora", "cpf": "12345678901", "email": "professor@sabia.edu",
    "ativo": true, "mustChangePassword": false } ]
```

### `POST /api/admin/professores` (Bearer, apenas ADMINISTRADOR)
```jsonc
// body
{ "nomeCompleto": "Novo Professor", "cpf": "11111111111", "email": "novo.professor@sabia.edu" }

// 201
{ "id": 10, "nome": "Novo Professor", "cpf": "11111111111", "email": "novo.professor@sabia.edu",
  "ativo": true, "mustChangePassword": true }

// 409 — CPF ou e-mail já usados por outro usuário
{ "status": 409, "erro": "CPF já cadastrado.", "timestamp": "..." }
{ "status": 409, "erro": "E-mail já cadastrado.", "timestamp": "..." }
```
Gera uma senha temporária aleatória (nunca retornada na resposta), salva com BCrypt, seta
`mustChangePassword = true` e envia a senha por e-mail via `EmailService` (mesmo mecanismo
`dev`/`smtp` do fluxo de recuperação de senha). A conta herda a `instituicao` do admin logado.

### `PATCH /api/admin/professores/{id}/desativar` e `/reativar` (Bearer, apenas ADMINISTRADOR)
```jsonc
// 200
{ "mensagem": "Professor desativado com sucesso." }
{ "mensagem": "Professor reativado com sucesso." }

// 404 — id não existe ou não é um professor
{ "status": 404, "erro": "Professor não encontrado.", "timestamp": "..." }
```
É soft delete: só alterna `Usuario.ativo`, nunca apaga o registro (turmas e atividades do
professor, que vivem no Serviço Pedagógico, continuam intactas). Um professor desativado:
não consegue mais logar (`403 Usuário inativo.`) e qualquer token JWT que ele já tivesse
para de funcionar imediatamente — o `JwtAuthFilter` recarrega o usuário do banco a cada
requisição e recusa quem está inativo.

---

## Contrato de validação de token para o API Gateway

O token é um **JWT HS256**. Estrutura das claims:

| Claim | Conteúdo |
|---|---|
| `sub` | id do usuário (numérico, como string) |
| `role` | `ADMINISTRADOR` \| `PROFESSOR` \| `ALUNO` |
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
   `X-User-Id: <sub>`, `X-User-Role: <role>`.

> O `auth-service` e o monólito `api/` já usam exatamente esse esquema
> (`sabia.jwt.secret` / env `JWT_SECRET`). Basta o Gateway usar o mesmo valor.

### Opção B — introspecção via `POST /api/auth/validate`

Para o Gateway que prefira não conhecer o segredo:

```jsonc
// POST /api/auth/validate   (body)
{ "token": "eyJ..." }

// 200 — token válido
{ "valido": true, "usuarioId": 2, "role": "PROFESSOR", "nome": "Ana Professora",
  "expiraEm": "2026-09-09T02:00:00Z" }

// 200 — token inválido/expirado (nunca lança erro)
{ "valido": false, "usuarioId": null, "role": null, "nome": null, "expiraEm": null }
```

Custa uma chamada de rede por requisição — recomenda-se cache curto (TTL ≤ 60s) no Gateway.

### Rotas públicas (não exigem token, o Gateway deve deixar passar)
`/api/auth/login`, `/api/auth/validate`, `/api/auth/esqueci-senha`, `/api/auth/redefinir-senha`, `/api/health`, `/swagger-ui/**`, `/v3/api-docs/**`

### Rotas restritas por papel
`/api/admin/**` exige `perfil = ADMINISTRADOR` (claim `perfil` do JWT). Se o Gateway validar
localmente (Opção A), ele deve replicar essa checagem antes de repassar a requisição; o
`auth-service` também valida de novo do seu lado (`hasRole('ADMINISTRADOR')`), então um
gateway mal configurado não é um risco de segurança — só uma experiência pior (403 vindo do
serviço em vez do Gateway).

---

## Variáveis de ambiente

Ver [`.env.example`](.env.example). As essenciais:

| Var | Default (dev) | Observação |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5433/sabia?currentSchema=auth` | Schema `auth` no banco compartilhado |
| `JWT_SECRET` | `dev-secret-change-in-production-must-be-at-least-32-chars` | **igual** no Gateway e demais serviços |
| `JWT_EXPIRATION_MS` | `28800000` (8h) | |
| `SERVER_PORT` | `8080` | |
| `FRONTEND_RECUPERAR_SENHA_URL` | `http://localhost:3000/redefinir-senha` | link enviado em `esqueci-senha` |
| `EMAIL_PROVIDER` | `dev` | `dev` apenas loga o link; `smtp` envia de verdade (usa `SMTP_*`/`EMAIL_FROM`) |

## Testes

```bash
./mvnw verify
```

Usa H2 em memória (perfil `test`) — não precisa de PostgreSQL.

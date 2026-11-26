# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sabiá** is an educational platform for managing evaluative activities between professors and students. Full-stack monorepo:
- `auth-service/` — Spring Boot 4 (Java 21): login, JWT, perfis, primeiro acesso (schema `auth`, porta 8080)
- `pedagogico-service/` — Spring Boot 4 (Java 21): turmas, atividades, submissões, lições, sandbox (schema `pedagogico`, porta 8081)
- `ia-service/` — FastAPI (Python 3.12): geração e revisão com Gemini (porta 8002)
- `api-gateway/` — Fastify (Node 22): roteia `/api/*` e valida o JWT (porta 8000)
- `web/` — Next.js 16 + React 19 + TypeScript frontend (porta 3000)
- `docs/` — Architecture and setup documentation

O monólito `api/` original não existe mais. Um único PostgreSQL (porta 5433 no host) guarda os schemas `auth` e `pedagogico`; os serviços conversam por RabbitMQ (`docs/mensageria.md`).

## Commands

### Start local environment

```bash
# Stack completo (banco, RabbitMQ, serviços, gateway e web)
docker compose up --build

# Só a infraestrutura, para rodar um serviço na IDE
docker compose up -d database rabbitmq

# Frontend (http://localhost:3000)
cd web && pnpm install && pnpm dev
```

### Backend (auth-service/ e pedagogico-service/)

```bash
cd auth-service && ./mvnw test            # ou cd pedagogico-service
./mvnw clean package                      # Build JAR
./mvnw spring-boot:run                    # Run with dev profile
mvn -DskipTests package                   # Reactor pela raiz (auth-service + pedagogico-service)
```

### Frontend (web/)

```bash
npm run dev                 # Dev server
npm run build               # Production build
npm run type-check          # TypeScript check
npm run lint                # ESLint
```

### Makefile shortcuts

O `Makefile` ainda tem alvos do antigo `api/` e está desatualizado; prefira os comandos acima.

## Architecture

### Backend (auth-service/ e pedagogico-service/)

Layers: `Controller → Service → Repository → JPA Entity`

- DTOs for all request/response; no `pedagogico-service` são mapeados com **MapStruct** (never map manually)
- **Spring Security** + stateless JWT; o `auth-service` emite o token, os demais só validam (`JWT_SECRET` compartilhado)
- `GlobalExceptionHandler` centralizes error responses
- **SpringDoc/Swagger UI** at `/swagger-ui.html` and `/v3/api-docs`
- Dev profile: `ddl-auto: update`, seed data loaded from `data.sql` (cada serviço tem o seu). Não há Flyway/Liquibase: remover atributo de entidade não apaga a coluna (ver `database/migrations/`)

Domain entities: `auth-service` — `Usuario` (PROFESSOR/ALUNO/ADMINISTRADOR), `Aluno`, `Professor`, `Instituicao`; `pedagogico-service` — `Turma`, `AtividadeAvaliativa`, `Submissao`, `Correcao`, `Licao`, `ProjetoSandbox`.

Package structure:
```
com.sabia.pedagogico        # (auth-service: com.sabia.auth)
├── controller/
│   ├── aluno/       # Endpoints for ALUNO role
│   ├── professor/   # Endpoints for PROFESSOR role
│   ├── interno/     # Chamadas entre serviços
│   └── publico/     # Sem autenticação (convites)
├── dto/
│   ├── request/
│   └── response/
├── mapper/          # MapStruct interfaces
├── model/
│   ├── atividade/
│   ├── instituicao/
│   └── turma/
├── repository/
├── service/
└── config/          # Security, JWT, CORS, OpenAPI
```

### Frontend (web/)

- **App Router** with nested layouts
- **TanStack Query** for server state; **React Hook Form + Zod** for forms
- **Axios** for API calls (configured in `lib/axios.ts` or similar)
- **shadcn/ui + Radix UI + Tailwind CSS 4** for UI components
- **Tiptap** for rich text editing in activity descriptions

### REST API routes

| Role | Path prefix |
|---|---|
| Auth | `POST /api/auth/login` (via gateway: `/api/auth/*`, `/api/admin/*`) |
| Professor | `/api/pedagogico/api/professor/atividades`, `.../submissoes`, `.../licoes`, `.../turmas` |
| Aluno | `/api/pedagogico/api/aluno/atividades`, `.../submissoes`, `.../licoes`, `.../projetos` |

O gateway (`:8000`) remove o prefixo `/api/pedagogico` antes de chamar o `pedagogico-service`.

## Environment Variables

**Backend** — set in env or override `application.yml`:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sabia
SPRING_DATASOURCE_USERNAME=sabia
SPRING_DATASOURCE_PASSWORD=sabia
SPRING_PROFILES_ACTIVE=dev
JWT_SECRET=<min 32 chars>
JWT_EXPIRATION_MS=28800000
CORS_ORIGINS=http://localhost:3000
```

**Frontend** — `web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PEDAGOGICO_API_URL=http://localhost:8000/api/pedagogico
```

## Code Style

- EditorConfig: 2-space default, 4-space for Java/YAML, tabs for Makefile.
- Backend: Lombok + MapStruct — avoid manual getters/setters and manual DTO mapping.
- Frontend: Tailwind utility classes; component variants via `class-variance-authority`.

## Git Workflow

Branches: `main` (production), `develop` (integration), `feat/*`, `fix/*`, `chore/*`.
CI runs separately for `auth-service/`, `pedagogico-service/` and `web/` path changes (see `.github/workflows/`).

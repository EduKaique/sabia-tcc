# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sabiá** is an educational platform for managing evaluative activities between professors and students. Full-stack monorepo:
- `api/` — Spring Boot 3.4 (Java 21) REST API
- `web/` — Next.js 16 + React 19 + TypeScript frontend
- `docs/` — Architecture and setup documentation

## Commands

### Start local environment

```bash
# Start PostgreSQL first (required before API)
docker compose up -d db

# Backend (http://localhost:8080)
cd api && ./mvnw spring-boot:run

# Frontend (http://localhost:3000)
cd web && npm install && npm run dev
```

Or use `make dev` / `docker compose up --build` to run everything together.

### Backend (api/)

```bash
./mvnw clean package        # Build JAR
./mvnw test                 # Run all tests
./mvnw spring-boot:run      # Run with dev profile
```

### Frontend (web/)

```bash
npm run dev                 # Dev server
npm run build               # Production build
npm run type-check          # TypeScript check
npm run lint                # ESLint
```

### Makefile shortcuts

```bash
make build-api
make test-api
make test-web
make test        # both
```

## Architecture

### Backend (api/)

Layers: `Controller → Service → Repository → JPA Entity`

- DTOs for all request/response, mapped with **MapStruct** (never map manually)
- **Spring Security** + stateless JWT (JJWT 0.12.6); filter chain in `SecurityConfig`
- `GlobalExceptionHandler` centralizes error responses
- **SpringDoc/Swagger UI** at `/swagger-ui.html` and `/v3/api-docs`
- Dev profile: `ddl-auto: update`, seed data loaded from `data.sql`

Domain entities: `Usuario` (PROFESSOR/ALUNO roles), `AtividadeAvaliativa`, `Submissao`, `Correcao`, `Turma`, `Instituicao`.

Package structure:
```
com.sabia.api
├── controller/
│   ├── aluno/       # Endpoints for ALUNO role
│   └── professor/   # Endpoints for PROFESSOR role
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
| Auth | `POST /api/auth/login` |
| Professor | `/api/professor/atividades`, `/api/professor/submissoes` |
| Aluno | `/api/aluno/atividades`, `/api/aluno/submissoes` |

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
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Code Style

- EditorConfig: 2-space default, 4-space for Java/YAML, tabs for Makefile.
- Backend: Lombok + MapStruct — avoid manual getters/setters and manual DTO mapping.
- Frontend: Tailwind utility classes; component variants via `class-variance-authority`.

## Git Workflow

Branches: `main` (production), `develop` (integration), `feat/*`, `fix/*`, `chore/*`.
CI runs separately for `api/` and `web/` path changes (see `.github/workflows/`).

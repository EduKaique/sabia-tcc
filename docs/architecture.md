# Arquitetura — Sabiá

## Visão geral

O Sabiá é uma plataforma de aprendizado estruturada como um monorepo com frontend e backend separados.

```
Browser  ─→  Next.js (apps/web)  ─→  Spring Boot API (apps/api)  ─→  PostgreSQL
```

## Componentes

### Frontend — `apps/web`

| Item | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS 4 |
| HTTP Client | Axios |
| Build | Turbopack |

**Estrutura de diretórios:**
```
src/
├── app/            # Rotas (App Router)
├── components/
│   └── ui/         # Componentes reutilizáveis
├── hooks/          # Custom hooks
├── lib/
│   └── api.ts      # Instância Axios configurada
├── styles/         
└── types/          # Interfaces TypeScript
```

### Backend — `apps/api`

| Item | Tecnologia |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.4 |
| Persistência | Spring Data JPA + Hibernate |
| Banco | PostgreSQL 16 |
| Segurança | Spring Security (Stateless/JWT) |
| Documentação | SpringDoc OpenAPI (Swagger UI) |

**Estrutura de pacotes:**
```
com.sabia.api/
├── config/         # Beans de configuração (Security, OpenAPI, CORS)
├── controller/     # REST Controllers
├── domain/
│   └── model/      # Entidades JPA
├── dto/            # Data Transfer Objects
├── exception/      # Exceções customizadas + GlobalExceptionHandler
├── repository/     # Interfaces JpaRepository
└── service/        # Regras de negócio
```

### Banco de dados

- PostgreSQL 16 rodando em Docker localmente
- JPA/Hibernate gerencia o schema via `ddl-auto`
- `dev`: `create-drop` — recria ao iniciar
- `prod`: `validate` — apenas valida o schema (migrations via Flyway recomendado)

## Comunicação

- Frontend → Backend: HTTP REST + JSON
- Autenticação: Bearer Token (JWT) via `Authorization` header
- CORS configurado para `localhost:3000` em desenvolvimento

## Endpoints base

| Método | Path | Descrição |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/swagger-ui.html` | Documentação interativa |
| GET | `/v3/api-docs` | OpenAPI JSON spec |

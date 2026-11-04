# Setup do ambiente — Sabiá

## Pré-requisitos

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Java 21** — [Adoptium Temurin](https://adoptium.net/)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop/)
- **Git**

## 1. Clonar o repositório

```bash
git clone https://github.com/<seu-usuario>/sabia-tcc.git
cd sabia-tcc
```

## 2. Configurar variáveis de ambiente

```bash
# Frontend
cp web/.env.example web/.env.local

# Backend
cp auth-service/.env.example auth-service/.env
```

Edite os arquivos conforme necessário (as defaults já funcionam com o Docker Compose local).

## 3. Subir o banco de dados

```bash
docker compose up -d database
```

Aguarde o PostgreSQL inicializar. Verifique com:

```bash
docker compose logs database
```

## 4. Rodar o backend

```bash
cd apps/api
./mvnw spring-boot:run
```

A API estará disponível em `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui.html`

## 5. Rodar o frontend

```bash
cd apps/web
npm install
npm run dev
```

O frontend estará em `http://localhost:3000`.

---

## Subir tudo com Docker

Para subir frontend + backend + banco juntos:

```bash
docker compose up --build
```

---

## Mensageria (RabbitMQ)

Os serviços `auth`, `pedagogico` e `ia` trocam eventos de integração via RabbitMQ.
Documentação completa (fluxos, contratos, retry/DLQ, testes): [mensageria.md](mensageria.md).

```bash
docker compose up -d --build rabbitmq auth-service pedagogico-service ia-service
```

- Management UI: `http://localhost:15672` — credenciais `RABBITMQ_USER` / `RABBITMQ_PASS` (default `sabia` / `sabia`)
- AMQP: `localhost:5672`

> Não use `guest/guest`: o usuário `guest` só aceita conexões de loopback.

---

## Comandos úteis

```bash
make db           # sobe apenas o PostgreSQL
make dev          # sobe tudo com Docker
make stop         # para todos os containers
make clean        # remove containers e volumes
make test-api     # roda testes do backend
make build-api    # compila o backend (.jar)
```

## Branches

| Branch | Propósito |
|---|---|
| `main` | Código estável / produção |
| `develop` | Integração contínua |
| `feat/*` | Novas funcionalidades |
| `fix/*` | Correções de bugs |
| `chore/*` | Manutenção / infra |

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
cp apps/web/.env.example apps/web/.env.local

# Backend
cp apps/api/.env.example apps/api/.env
```

Edite os arquivos conforme necessário (as defaults já funcionam com o Docker Compose local).

## 3. Subir o banco de dados

```bash
docker compose up -d db
```

Aguarde o PostgreSQL inicializar. Verifique com:

```bash
docker compose logs db
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

## Mensageria (RabbitMQ) — Serviço Pedagógico

O `pedagogico-service` usa o RabbitMQ para publicar eventos de correção.

Subir apenas o RabbitMQ:

```bash
docker compose up -d rabbitmq
```

- Management UI: `http://localhost:15672` — usuário `sabia`, senha `sabia`
- AMQP: `localhost:5672`

> Não use `guest/guest`: o usuário `guest` só aceita conexões de loopback e é recusado pela porta mapeada do Docker.

### Variáveis de ambiente

O Spring Boot não lê arquivos `.env`; defina as variáveis no shell ou no `docker-compose.yml`.

| Variável | Default | Uso |
|---|---|---|
| `RABBITMQ_HOST` | `localhost` | Host do broker (no compose: `rabbitmq`) |
| `RABBITMQ_PORT` | `5672` | Porta AMQP |
| `RABBITMQ_USER` | `sabia` | Usuário |
| `RABBITMQ_PASS` | `sabia` | Senha |

### Topologia declarada

Definida em `sabia.mensageria.correcoes.*` (`pedagogico-service/src/main/resources/application.yml`):

| Item | Valor |
|---|---|
| Exchange (direct, durável) | `sabia.correcoes.exchange` |
| Fila (durável) | `sabia.correcoes.solicitadas.queue` |
| Routing key | `correcao.solicitada` |

A declaração é feita no startup do serviço. Se o RabbitMQ estiver fora do ar, o serviço sobe normalmente e registra um `WARN`.

### Como verificar

1. Suba o RabbitMQ e o `pedagogico-service`.
2. Abra `http://localhost:15672` → aba **Exchanges** → `sabia.correcoes.exchange`.
3. Em **Bindings**, confira o binding para `sabia.correcoes.solicitadas.queue` com routing key `correcao.solicitada`.

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

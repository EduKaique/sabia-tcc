# Sabiá
Plataforma de aprendizado — Trabalho de Conclusão de Curso

## Estrutura do repositório

```
sabia-tcc/
├── web/              # Frontend — Next.js 16 + TypeScript + Tailwind
├── api/              # Monólito  — Java 21 + Spring Boot + PostgreSQL (pedagógico, sandbox, IA)
├── auth-service/     # Microsserviço de Autenticação (IAM & Perfis) — porta 8081
├── docs/             # Documentação técnica
├── .github/          # CI/CD e templates
├── setup.sh
└── docker-compose.yml
```

> A arquitetura-alvo é de microsserviços (ver [docs/architecture.md](docs/architecture.md)).
> O `auth-service` é o primeiro serviço extraído do monólito e o **único emissor** de token JWT.

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 22+ |
| Java | 21 |
| Maven | 3.9+ |
| Docker + Compose | latest |

## Início rápido

```bash
# Clonar o repositório
git clone https://github.com/EduKaique/sabia-tcc.git
cd sabia-tcc

# Setup
./setup.sh

# Subir infraestrutura (bancos de dados)
docker compose up -d db auth-db

# Serviço de autenticação (porta 8081)
cd ./auth-service
./mvnw spring-boot:run

# Monólito / API (porta 8080, outro terminal)
cd ./api
./mvnw spring-boot:run

# Frontend (outro terminal)
cd ./web
pnpm install
pnpm dev
```

Ou use o Makefile:

```bash
make dev      # sobe tudo com Docker
make setup    # instala dependências
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Setup detalhado](docs/setup.md)


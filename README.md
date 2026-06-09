# Sabiá

> Plataforma de aprendizado — Trabalho de Conclusão de Curso

## Estrutura do repositório

```
sabia-tcc/
├── web/              # Frontend — Next.js 15 + TypeScript + Tailwind
├── api/              # Backend  — Java 21 + Spring Boot 3 + PostgreSQL
├── docs/             # Documentação técnica
├── .github/          # CI/CD e templates
├── setup.sh
└── docker-compose.yml
```

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20+ |
| Java | 21 |
| Maven | 3.9+ |
| Docker + Compose | latest |

## Início rápido

```bash
# Clonar o repositório
git clone https://github.com/<seu-usuario>/sabia-tcc.git
cd sabia-tcc

# Subir infraestrutura (banco de dados)
docker compose up -d db

# Backend
cd apps/api
./mvnw spring-boot:run

# Frontend (outro terminal)
cd apps/web
npm install
npm run dev
```

Ou use o Makefile:

```bash
make dev      # sobe tudo com Docker
make setup    # instala dependências
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Setup detalhado](docs/setup.md)


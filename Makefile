.PHONY: dev setup build test clean logs

## Sobe toda a stack com Docker
dev:
	docker compose up --build

## Sobe apenas o banco
db:
	docker compose up -d db

## Para todos os containers
stop:
	docker compose down

## Para e remove volumes
clean:
	docker compose down -v

## Instala dependências do frontend
setup-web:
	cd apps/web && npm install

## Compila o backend
build-api:
	cd apps/api && ./mvnw clean package -DskipTests

## Roda testes do backend
test-api:
	cd apps/api && ./mvnw test

## Roda testes do frontend
test-web:
	cd apps/web && npm run test

## Roda todos os testes
test: test-api test-web

## Exibe logs dos containers
logs:
	docker compose logs -f

## Setup inicial completo
setup: setup-web
	@echo "Setup concluído! Rode 'make db' para subir o banco e depois 'make dev' para tudo."

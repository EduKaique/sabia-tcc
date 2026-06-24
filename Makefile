.PHONY: dev setup build test clean logs

## Sobe toda a stack com Docker
dev:
	docker compose up --build

api-dev:
	cd api && mvn spring-boot:run

web-dev:
	cd web && pnpm dev

## Sobe apenas o banco
db:
	docker compose up -d db

## Para todos os containers
stop:
	docker compose down

## Para e remove volumes
docker clean:
	docker compose down -v

## Compila o backend
build-api:
	cd api && ./mvnw clean package -DskipTests

## Exibe logs dos containers
logs:
	docker compose logs -f


#!/usr/bin/env bash
set -euo pipefail

echo "Sabiá — Setup inicial"
echo "========================"

# Verifica pré-requisitos
command -v node >/dev/null 2>&1 || { echo "❌ Node.js não encontrado. Instale a versão 20+."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm não encontrado. Execute: npm install -g pnpm"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "❌ Java não encontrado. Instale o Java 21."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker não encontrado."; exit 1; }

echo "✅ Pré-requisitos OK"

# Frontend
echo ""
echo "📦 Instalando dependências do frontend..."
cd web
pnpm install
cp -n .env.example .env.local 2>/dev/null && echo "✅ .env.local criado" || echo "ℹ️  .env.local já existe"
cd ..

# Backend
echo ""
echo "☕ Configurando backend..."
cd api
cp -n .env.example .env 2>/dev/null && echo "✅ .env criado" || echo "ℹ️  .env já existe"

# Gera o Maven Wrapper se não existir
if [ ! -f "./mvnw" ]; then
  echo "⚙️  Gerando Maven Wrapper..."
  mvn -N wrapper:wrapper -Dmaven=3.9.6
  echo "✅ mvnw gerado"
else
  echo "ℹ️  mvnw já existe"
fi
cd ..

echo ""
echo "🚀 Setup concluído! Próximos passos:"
echo "   1. make db                      — sobe o PostgreSQL"
echo "   2. cd api && ./mvnw spring-boot:run"
echo "   3. cd web && pnpm dev"
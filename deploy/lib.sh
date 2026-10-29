#!/usr/bin/env bash
# Funções comuns dos scripts de deploy. Use com: source "$(dirname "$0")/lib.sh"
# Nunca imprime valores do .env.prod.

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$RAIZ/.env.prod}"
COMPOSE_FILE="$RAIZ/docker-compose.prod.yml"
ARQ_TAG_ATUAL="$RAIZ/deploy/.current_tag"
ARQ_TAG_ANTERIOR="$RAIZ/deploy/.last_tag"

erro() { echo "ERRO: $*" >&2; exit 1; }
info() { echo "==> $*"; }

exigir_env_file() {
  [[ -f "$ENV_FILE" ]] || erro "$ENV_FILE não existe (copie deploy/.env.prod.example)."
  local modo
  modo="$(stat -c '%a' "$ENV_FILE")"
  [[ "$modo" == "600" ]] || erro "$ENV_FILE precisa ter permissão 600 (está $modo): chmod 600 $ENV_FILE"
}

# Lê uma variável não secreta do .env.prod (última ocorrência), sem executar o arquivo.
ler_env() {
  local valor
  valor="$(grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
  valor="${valor%\"}"
  valor="${valor#\"}"
  printf '%s' "$valor"
}

tag_atual() { cat "$ARQ_TAG_ATUAL" 2>/dev/null || true; }
tag_anterior() { cat "$ARQ_TAG_ANTERIOR" 2>/dev/null || true; }

# docker compose do projeto de produção. IMAGE_TAG vem do ambiente ou da última
# tag implantada (o compose exige uma tag mesmo para exec/ps).
compose() {
  local tag="${IMAGE_TAG:-$(tag_atual)}"
  IMAGE_TAG="${tag:-indefinida}" docker compose -p sabia-prod -f "$COMPOSE_FILE" \
    --env-file "$ENV_FILE" "$@"
}

banco_no_ar() {
  [[ -n "$(compose ps -q --status running database 2>/dev/null)" ]]
}

#!/usr/bin/env bash
# Implanta uma tag das imagens do GHCR.
#   deploy/deploy.sh sha-1a2b3c4     # ou release / main / 1.2.3
#   deploy/deploy.sh --rollback      # volta para a tag anterior (deploy/.last_tag)
set -euo pipefail
source "$(dirname "$0")/lib.sh"

[[ $# -eq 1 ]] || erro "uso: $0 <tag> | --rollback"

exigir_env_file

anterior="$(tag_atual)"
if [[ "$1" == "--rollback" ]]; then
  tag="$(tag_anterior)"
  [[ -n "$tag" ]] || erro "não há tag anterior registrada em $ARQ_TAG_ANTERIOR."
  info "Rollback: $anterior -> $tag"
else
  tag="$1"
fi
[[ "$tag" =~ ^[A-Za-z0-9_.-]+$ ]] || erro "tag inválida: $tag"

if banco_no_ar; then
  info "Backup antes do deploy"
  "$RAIZ/deploy/backup.sh"
else
  info "Banco ainda não está no ar: sem backup (primeiro deploy?)"
fi

export IMAGE_TAG="$tag"
if [[ "${SABIA_SKIP_PULL:-0}" == "1" ]]; then
  # Só para testes com imagens construídas localmente; nunca no servidor.
  info "SABIA_SKIP_PULL=1: usando imagens locais ($tag)"
else
  info "Baixando imagens ($tag)"
  compose pull --quiet
fi

info "Subindo serviços e aguardando os healthchecks (até 10 min)"
if ! compose up -d --remove-orphans --wait --wait-timeout 600; then
  compose ps
  erro "algum serviço não ficou saudável. Veja: docker compose -p sabia-prod logs --tail=100 <serviço>"
fi

compose ps
if [[ -n "$anterior" && "$anterior" != "$tag" ]]; then
  echo "$anterior" > "$ARQ_TAG_ANTERIOR"
fi
echo "$tag" > "$ARQ_TAG_ATUAL"

info "Deploy de $tag concluído."
if [[ -n "$(tag_anterior)" ]]; then
  echo "Rollback para $(tag_anterior): $RAIZ/deploy/deploy.sh --rollback"
  echo "(o schema do banco não volta: ddl-auto=update só adiciona; o backup acima é a garantia)"
fi

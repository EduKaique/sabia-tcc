#!/usr/bin/env bash
# docker compose do projeto de produção, com os mesmos argumentos:
#   deploy/dc.sh ps
#   deploy/dc.sh logs --tail=200 -f caddy
# IMAGE_TAG vem do ambiente ou de deploy/.current_tag (a última tag implantada).
set -euo pipefail
source "$(dirname "$0")/lib.sh"

exigir_env_file
if [[ -z "${IMAGE_TAG:-}" && -z "$(tag_atual)" ]]; then
  echo "AVISO: sem IMAGE_TAG e sem $ARQ_TAG_ATUAL (nenhum deploy ainda?)." >&2
fi
compose "$@"

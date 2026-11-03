#!/usr/bin/env bash
# Smoke test de produção. Rode de OUTRA máquina (não do servidor).
#   deploy/smoke.sh https://203.0.113.10
#   deploy/smoke.sh http://203.0.113.10      # antes do certificado (Caddyfile.http)
# Requer curl e nc. Sai com código != 0 se alguma checagem falhar.
set -euo pipefail

[[ $# -eq 1 ]] || { echo "uso: $0 <https://IP|http://IP>" >&2; exit 2; }
BASE="${1%/}"
HOST="$(sed -E 's#^[a-z]+://##; s#[:/].*$##' <<< "$BASE")"
# -k: em staging do Let's Encrypt o certificado não é confiável (só para o teste).
CURL=(curl -sk --max-time 15)
falhas=0

ok() { printf 'OK     %s\n' "$1"; }
falha() { printf 'FALHA  %s\n' "$1"; falhas=$((falhas + 1)); }

status() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$@" || echo 000; }

esperar_status() {
  local descricao="$1" esperado="$2"
  shift 2
  local obtido
  obtido="$(status "$@")"
  if [[ "$obtido" == "$esperado" ]]; then ok "$descricao ($obtido)"; else falha "$descricao (esperado $esperado, veio $obtido)"; fi
}

LOGIN_JSON='{"login":"admin@sabia.edu","senha":"password"}'

esperar_status "/ responde" 200 "$BASE/"
esperar_status "health público /api/health" 200 "$BASE/api/health"

codigo="$(status -X POST -H 'Content-Type: application/json' -d "$LOGIN_JSON" "$BASE/api/auth/login")"
if [[ "$codigo" != "200" && "$codigo" != "000" ]]; then
  ok "login do seed de dev (admin@sabia.edu/password) recusado ($codigo)"
else
  falha "login do seed de dev (admin@sabia.edu/password) deveria falhar (veio $codigo)"
fi

for caminho in /v3/api-docs /swagger-ui.html /docs /openapi.json /api/ia/docs \
  /api/ia/openapi.json /api/pedagogico/v3/api-docs /api/auth/v3/api-docs; do
  corpo="$("${CURL[@]}" "$BASE$caminho" || true)"
  if grep -qiE '"openapi"|swagger-ui' <<< "$corpo"; then
    falha "documentação exposta em $caminho"
  else
    ok "sem documentação em $caminho"
  fi
done

esperar_status "/api/pedagogico/api/interno/ bloqueado" 404 "$BASE/api/pedagogico/api/interno/"

codigo="$(status -X POST -H "Origin: $BASE" -H 'Content-Type: application/json' \
  -d '{"login":"smoke@teste.invalid","senha":"x"}' "$BASE/api/auth/login")"
if [[ "$codigo" != "403" && "$codigo" != "000" ]]; then
  ok "POST de login com Origin: $BASE não é barrado por CORS ($codigo)"
else
  falha "POST de login com Origin: $BASE veio $codigo (confira CORS_ORIGINS)"
fi

for porta in 5432 8000 8002 8080 8081 3000 5672 15672; do
  if nc -z -w2 "$HOST" "$porta" 2>/dev/null; then
    falha "porta $porta ABERTA em $HOST"
  else
    ok "porta $porta fechada"
  fi
done

if (( falhas > 0 )); then
  echo "Smoke test: $falhas falha(s)."
  exit 1
fi
echo "Smoke test: tudo OK."

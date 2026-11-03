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

# Código HTTP da requisição. O curl já escreve 000 quando não há resposta.
status() {
  local codigo
  codigo="$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$@" || true)"
  printf '%s' "${codigo:-000}"
}

# Explicação para códigos que nunca contam como sucesso.
explicar() {
  case "$1" in
    000) echo " — sem resposta HTTP: falha de TLS ou de rede (certificado, porta 80/443, firewall)" ;;
    30?) echo " — redirecionamento: 308 costuma ser o Caddy mandando http→https; use a URL https://" ;;
  esac
}

# OK só se veio exatamente o código esperado.
esperar_status() {
  local descricao="$1" esperado="$2"
  shift 2
  local obtido
  obtido="$(status "$@")"
  if [[ "$obtido" == "$esperado" ]]; then
    ok "$descricao ($obtido)"
  else
    falha "$descricao (esperado $esperado, veio $obtido)$(explicar "$obtido")"
  fi
}

LOGIN_JSON='{"login":"admin@sabia.edu","senha":"password"}'

esperar_status "/ responde" 200 "$BASE/"
esperar_status "health público /api/health" 200 "$BASE/api/health"

esperar_status "login do seed de dev (admin@sabia.edu/password) recusado" 401 \
  -X POST -H 'Content-Type: application/json' -d "$LOGIN_JSON" "$BASE/api/auth/login"

# Documentação: precisa haver resposta HTTP de verdade (não 000/30x) e sem OpenAPI/Swagger.
corpo_tmp="$(mktemp)"
trap 'rm -f "$corpo_tmp"' EXIT
for caminho in /v3/api-docs /swagger-ui.html /docs /openapi.json /api/ia/docs \
  /api/ia/openapi.json /api/pedagogico/v3/api-docs /api/auth/v3/api-docs; do
  codigo="$("${CURL[@]}" -o "$corpo_tmp" -w '%{http_code}' "$BASE$caminho" || true)"
  codigo="${codigo:-000}"
  if [[ "$codigo" == 000 || "$codigo" == 3* ]]; then
    falha "documentação em $caminho não verificada (veio $codigo)$(explicar "$codigo")"
  elif grep -qiE '"openapi"|swagger-ui' "$corpo_tmp"; then
    falha "documentação exposta em $caminho ($codigo)"
  else
    ok "sem documentação em $caminho ($codigo)"
  fi
done

esperar_status "/api/pedagogico/api/interno/ bloqueado" 404 "$BASE/api/pedagogico/api/interno/"

# Usuário inexistente: 401 prova que o CORS deixou passar (403 = Origin barrado).
esperar_status "POST de login com Origin: $BASE não é barrado por CORS" 401 \
  -X POST -H "Origin: $BASE" -H 'Content-Type: application/json' \
  -d '{"login":"smoke@teste.invalid","senha":"x"}' "$BASE/api/auth/login"

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

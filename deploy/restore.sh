#!/usr/bin/env bash
# Restaura um dump do backup.sh.
#   deploy/restore.sh <arquivo.dump> --test   # banco temporário; não toca no banco real
#   deploy/restore.sh <arquivo.dump>          # substitui o banco "sabia" (pede confirmação)
set -euo pipefail
source "$(dirname "$0")/lib.sh"

[[ $# -ge 1 && $# -le 2 ]] || erro "uso: $0 <arquivo.dump> [--test]"
arquivo="$1"
modo_teste=false
if [[ $# -eq 2 ]]; then
  [[ "$2" == "--test" ]] || erro "opção desconhecida: $2"
  modo_teste=true
fi

[[ -f "$arquivo" ]] || erro "arquivo não encontrado: $arquivo"
exigir_env_file
banco_no_ar || erro "o container do banco não está rodando."

psql_em() {
  local banco="$1"
  shift
  compose exec -T database psql -U sabia -d "$banco" -v ON_ERROR_STOP=1 -qAt "$@"
}

if $modo_teste; then
  temp="sabia_restore_teste_$(date +%s)"
  trap 'psql_em postgres -c "DROP DATABASE IF EXISTS $temp" >/dev/null 2>&1 || true' EXIT
  info "Restaurando em banco temporário $temp"
  psql_em postgres -c "CREATE DATABASE $temp"
  compose exec -T database pg_restore -U sabia -d "$temp" --no-owner --exit-on-error < "$arquivo"

  info "Tabelas por schema:"
  psql_em "$temp" -F ' ' -c "SELECT table_schema, count(*) FROM information_schema.tables
    WHERE table_schema IN ('auth', 'pedagogico') GROUP BY 1 ORDER BY 1"
  usuarios="$(psql_em "$temp" -c "SELECT count(*) FROM auth.usuario")"
  turmas="$(psql_em "$temp" -c "SELECT count(*) FROM pedagogico.turma")"
  echo "auth.usuario: $usuarios linhas"
  echo "pedagogico.turma: $turmas linhas"
  (( usuarios > 0 )) || erro "dump sem usuários: não parece um backup válido."
  info "Restore de teste OK (banco temporário removido)."
  exit 0
fi

echo "ATENÇÃO: o banco 'sabia' será SUBSTITUÍDO pelo conteúdo de $arquivo."
echo "Os serviços ficam fora do ar durante a restauração."
read -r -p "Digite RESTAURAR para continuar: " confirmacao
[[ "$confirmacao" == "RESTAURAR" ]] || erro "cancelado."

info "Backup de segurança do estado atual"
"$RAIZ/deploy/backup.sh"

info "Parando os serviços que escrevem no banco"
compose stop caddy api-gateway auth-service pedagogico-service

info "Restaurando"
compose exec -T database pg_restore -U sabia -d sabia --clean --if-exists --no-owner \
  --exit-on-error < "$arquivo"

info "Subindo os serviços"
compose up -d --wait --wait-timeout 600
info "Restore concluído."

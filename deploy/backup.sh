#!/usr/bin/env bash
# Dump do banco (pg_dump -Fc). Antes do dump, mantém só os DUMP_RETENCAO mais recentes;
# depois, apaga também os de mais de 7 dias.
#   deploy/backup.sh
# Cron diário (crontab -e do usuário que roda o docker), às 03:15:
#   15 3 * * * /opt/sabia/deploy/backup.sh >> /var/backups/sabia/backup.log 2>&1
set -euo pipefail
source "$(dirname "$0")/lib.sh"

exigir_env_file

BACKUP_DIR="$(dir_backup)"
BACKUP_REMOTE="${BACKUP_REMOTE:-$(ler_env BACKUP_REMOTE)}"
RETENCAO_DIAS=7
# Dumps existentes mantidos antes de gerar o novo (o novo é o seguinte: com 2, ficam 3).
DUMP_RETENCAO=2
MINIMO_LIVRE_KB=$((1024 * 1024)) # 1 GB

umask 077
preparar_dir_backup "$BACKUP_DIR"

# Poda antes do novo dump: mantém os DUMP_RETENCAO mais recentes (por data de modificação) e
# remove os demais. Só sabia-*.dump no próprio diretório, sem recursão. Falha aqui não aborta o backup.
podar_dumps() {
  local dir="$1" mantidos=0 linha caminho
  if [[ -z "$dir" || "$dir" == "/" || ! -d "$dir" ]]; then
    echo "AVISO: diretório de backup inválido ('$dir'): poda dos dumps ignorada." >&2
    return 0
  fi
  if [[ ! "$DUMP_RETENCAO" =~ ^[1-9][0-9]*$ ]]; then
    echo "AVISO: DUMP_RETENCAO inválida ('$DUMP_RETENCAO'): poda dos dumps ignorada." >&2
    return 0
  fi
  info "Poda dos dumps: mantendo os $DUMP_RETENCAO mais recentes em $dir"
  while IFS= read -r -d '' linha; do
    caminho="${linha#* }"
    if (( mantidos < DUMP_RETENCAO )); then
      echo "    mantido:  $caminho"
      mantidos=$((mantidos + 1))
    else
      echo "    removido: $caminho"
      rm -f -- "$caminho" || echo "AVISO: não foi possível remover $caminho." >&2
    fi
  done < <(find "$dir" -maxdepth 1 -type f -name 'sabia-*.dump' -printf '%T@ %p\0' | sort -z -rn)
}
podar_dumps "$BACKUP_DIR" || echo "AVISO: a poda dos dumps falhou; seguindo com o backup." >&2

livre_kb="$(df --output=avail -k "$BACKUP_DIR" | tail -n1 | tr -d ' ')"
if (( livre_kb < MINIMO_LIVRE_KB )); then
  erro "menos de 1 GB livre em $BACKUP_DIR ($((livre_kb / 1024)) MB). Backup abortado."
fi

banco_no_ar || erro "o container do banco não está rodando."

arquivo="$BACKUP_DIR/sabia-$(date +%Y%m%d-%H%M%S).dump"
parcial="$arquivo.parcial"
info "Gerando $arquivo"
if ! compose exec -T database pg_dump -U sabia -d sabia -Fc > "$parcial"; then
  rm -f "$parcial"
  erro "pg_dump falhou."
fi
mv "$parcial" "$arquivo"
chmod 600 "$arquivo"
info "Backup ok ($(du -h "$arquivo" | cut -f1))."

find "$BACKUP_DIR" -maxdepth 1 -name 'sabia-*.dump' -type f -mtime +"$RETENCAO_DIAS" -print -delete

if [[ -n "$BACKUP_REMOTE" ]]; then
  info "Copiando para o destino remoto"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a "$arquivo" "$BACKUP_REMOTE"
  else
    scp -q "$arquivo" "$BACKUP_REMOTE"
  fi
fi

echo "Para agendar diariamente (03:15), adicione ao crontab:"
echo "  15 3 * * * $RAIZ/deploy/backup.sh >> $BACKUP_DIR/backup.log 2>&1"

#!/usr/bin/env bash
# Dump do banco (pg_dump -Fc) com retenção de 7 dias.
#   deploy/backup.sh
# Cron diário (crontab -e do usuário que roda o docker), às 03:15:
#   15 3 * * * /opt/sabia/deploy/backup.sh >> /var/backups/sabia/backup.log 2>&1
set -euo pipefail
source "$(dirname "$0")/lib.sh"

exigir_env_file

BACKUP_DIR="${BACKUP_DIR:-$(ler_env BACKUP_DIR)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sabia}"
BACKUP_REMOTE="${BACKUP_REMOTE:-$(ler_env BACKUP_REMOTE)}"
RETENCAO_DIAS=7
MINIMO_LIVRE_KB=$((1024 * 1024)) # 1 GB

umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

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

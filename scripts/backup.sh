#!/bin/bash
# FizioFit — backup script
# Spúšťa sa denne cez cron na Hetzner VPS

set -e

BACKUP_DIR="/mnt/storagebox/backups"
DB_NAME="fiziofit"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# DB backup
pg_dump -U postgres "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"
echo "✅ DB backup: ${DB_NAME}_${DATE}.sql.gz ($(du -h "$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz" | cut -f1))"

# Storage backup (fotky, dokumenty)
tar czf "$BACKUP_DIR/storage_${DATE}.tar.gz" -C /var/lib/storage .
echo "✅ Storage backup: storage_${DATE}.tar.gz"

# Cleanup old backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "storage_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "🧹 Vyčistené zálohy staršie ako $RETENTION_DAYS dní"
#!/bin/bash

# MongoDB Restore Script for Creator OS
# Use this to restore a backup

if [ -z "$1" ]; then
    echo "❌ Error: Please provide backup file path"
    echo ""
    echo "Usage: $0 /path/to/backup.tar.gz"
    echo ""
    echo "Available backups:"
    ls -lh /tmp/mongodb_backups/*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE your current database!"
echo "📦 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Starting restore..."

# Extract backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "test_database" | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ Error: Invalid backup file structure"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restore database
mongorestore --uri="mongodb://localhost:27017" \
             --db=test_database \
             --drop \
             "$(dirname "$BACKUP_DIR")/test_database"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Database restored successfully!"
echo "🎯 Your app now has data from: $(basename $BACKUP_FILE)"

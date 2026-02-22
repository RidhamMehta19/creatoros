#!/bin/bash

# MongoDB Backup Script for Creator OS
# Run this anytime to backup your database

# Configuration
BACKUP_DIR="/tmp/mongodb_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="creator_os_backup_${DATE}"
DB_NAME="test_database"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Starting MongoDB backup..."
echo "📅 Date: $(date)"
echo "🗄️  Database: $DB_NAME"

# Create backup
mongodump --uri="mongodb://localhost:27017" \
          --db=$DB_NAME \
          --out=$BACKUP_DIR/$BACKUP_NAME

# Compress backup
cd $BACKUP_DIR
tar -czf ${BACKUP_NAME}.tar.gz $BACKUP_NAME/
rm -rf $BACKUP_NAME/

# Show results
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo "✅ Backup completed successfully!"
echo "📦 Backup file: $BACKUP_FILE"
echo "💾 Size: $SIZE"
echo ""
echo "📥 To download this backup:"
echo "   You can copy it from: $BACKUP_FILE"
echo ""
echo "♻️  To restore this backup later:"
echo "   mongorestore --uri='mongodb://localhost:27017' --gzip --archive=$BACKUP_FILE"
echo ""

# List all backups
echo "📋 All available backups:"
ls -lh $BACKUP_DIR/*.tar.gz 2>/dev/null | tail -5

echo ""
echo "🎯 Backup complete! Keep this file safe."

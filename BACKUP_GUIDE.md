# Creator OS - Backup & Restore Guide

## Quick Reference

### 📦 Create Backup
```bash
/app/scripts/backup_mongodb.sh
```

### ♻️ Restore Backup
```bash
/app/scripts/restore_mongodb.sh /tmp/mongodb_backups/creator_os_backup_YYYYMMDD_HHMMSS.tar.gz
```

---

## 1. GitHub Backup (Code)

### Setup (One-time)
1. Go to Emergent dashboard
2. Find GitHub integration section
3. Click "Connect GitHub" and authorize
4. Click "Save to GitHub" to push code

### When to Backup Code
- ✅ Before deploying
- ✅ After major feature additions
- ✅ Weekly (if actively developing)
- ✅ Before stopping your subscription

### What Gets Backed Up
- All source code (frontend + backend)
- Configuration files
- **NOT included:** Database data, environment variables

---

## 2. MongoDB Backup (Data)

### Automatic Backup Script

**Location:** `/app/scripts/backup_mongodb.sh`

**What it does:**
- Exports all users, content, and daily plans
- Compresses to `.tar.gz` file
- Stores in `/tmp/mongodb_backups/`

**How to run:**
```bash
cd /app/scripts
./backup_mongodb.sh
```

**Output example:**
```
✅ Backup completed successfully!
📦 Backup file: /tmp/mongodb_backups/creator_os_backup_20260222_062951.tar.gz
💾 Size: 12K
```

### When to Backup Database
- ✅ **BEFORE stopping Emergent subscription** (critical!)
- ✅ Before major data migrations
- ✅ Weekly if you have important user data
- ✅ Before testing risky changes

### Download Backup to Your Computer

**Option A: Through Emergent interface**
- Look for file download feature in dashboard

**Option B: Using command (if you have SSH access)**
```bash
# List backups
ls -lh /tmp/mongodb_backups/

# Note the backup filename, then download it through your interface
```

---

## 3. Restore Database

### Restore from Backup

**Location:** `/app/scripts/restore_mongodb.sh`

**⚠️ WARNING:** This will **replace** your current database!

**How to run:**
```bash
# List available backups
ls /tmp/mongodb_backups/

# Restore specific backup
/app/scripts/restore_mongodb.sh /tmp/mongodb_backups/creator_os_backup_20260222_062951.tar.gz
```

**You'll be asked to confirm:**
```
⚠️  WARNING: This will REPLACE your current database!
📦 Backup file: /tmp/mongodb_backups/creator_os_backup_20260222_062951.tar.gz

Are you sure? (yes/no): yes
```

---

## 4. Manual Backup (Advanced)

### Export Database Manually
```bash
# Full database dump
mongodump --uri="mongodb://localhost:27017" \
          --db=test_database \
          --out=/tmp/manual_backup

# Compress
tar -czf /tmp/manual_backup.tar.gz -C /tmp manual_backup/
```

### Restore Manually
```bash
# Extract
tar -xzf /tmp/manual_backup.tar.gz -C /tmp/

# Restore (⚠️ drops existing data)
mongorestore --uri="mongodb://localhost:27017" \
             --db=test_database \
             --drop \
             /tmp/manual_backup/test_database
```

---

## 5. Migration to Another Server

### Full Export (Take Everything With You)

**Step 1: Backup Code**
```bash
# From Emergent, use "Save to GitHub" feature
# OR manually copy /app directory
```

**Step 2: Backup Database**
```bash
/app/scripts/backup_mongodb.sh
# Download the .tar.gz file
```

**Step 3: On New Server**
```bash
# 1. Clone code from GitHub
git clone your-repo-url

# 2. Install dependencies
cd frontend && yarn install
cd ../backend && pip install -r requirements.txt

# 3. Setup MongoDB
# Install MongoDB on new server

# 4. Restore database
./scripts/restore_mongodb.sh /path/to/backup.tar.gz

# 5. Configure environment variables
cp .env.example .env
# Edit .env with new values

# 6. Start services
# Backend: uvicorn server:app --host 0.0.0.0 --port 8001
# Frontend: yarn expo start
```

---

## 6. Backup Schedule Recommendations

### For Development/Testing
- **Code:** Before each major change
- **Database:** Weekly or before risky changes

### For Production (with real users)
- **Code:** Daily (automated via GitHub)
- **Database:** Daily automated backups
- **Keep:** Last 7 days + monthly archives

### Critical Reminder
**⚠️ IF YOU STOP PAYING EMERGENT:**
1. **Backup code** to GitHub (save to GitHub button)
2. **Backup database** using backup script
3. **Download backup file** to your computer
4. **Emergent does NOT keep your data** after subscription ends

---

## 7. What Gets Backed Up?

### ✅ Included in MongoDB Backup
- User profiles (niche, tone, platforms)
- All generated content (scripts, captions, hooks)
- Daily plans history
- Timestamps and metadata

### ❌ NOT Included in MongoDB Backup
- Source code (use GitHub for this)
- Environment variables (`.env` files)
- API keys (store separately)
- System configurations

---

## 8. Troubleshooting

### "Command not found" Error
```bash
# Make scripts executable
chmod +x /app/scripts/backup_mongodb.sh
chmod +x /app/scripts/restore_mongodb.sh
```

### "Connection refused" Error
```bash
# Check if MongoDB is running
sudo supervisorctl status mongodb

# Start if needed
sudo supervisorctl start mongodb
```

### "Out of space" Error
```bash
# Clean old backups
rm /tmp/mongodb_backups/creator_os_backup_2026*.tar.gz

# Keep only last 5 backups
cd /tmp/mongodb_backups && ls -t *.tar.gz | tail -n +6 | xargs rm --
```

---

## 9. Quick Commands Cheat Sheet

```bash
# Backup database
/app/scripts/backup_mongodb.sh

# List all backups
ls -lh /tmp/mongodb_backups/

# Restore latest backup
/app/scripts/restore_mongodb.sh $(ls -t /tmp/mongodb_backups/*.tar.gz | head -1)

# Check database size
mongo test_database --eval "db.stats(1024*1024)"

# Export users only
mongoexport --uri="mongodb://localhost:27017" \
            --db=test_database \
            --collection=users \
            --out=/tmp/users_backup.json
```

---

## 10. Support

**Need help?**
- GitHub backup: Contact Emergent support
- Database issues: Check MongoDB is running (`sudo supervisorctl status`)
- Lost backups: Check `/tmp/mongodb_backups/` directory

**Emergency contact:** support@emergent.com

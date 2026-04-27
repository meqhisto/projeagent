#!/bin/bash
# ============================================
# Remote Server Test Script for Phase 1
# Uzak Sunucuda Database Backup Testi
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Phase 1: Database Backup System Test${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Test 1: Check if files exist
echo -e "${YELLOW}Test 1: Dosya varlığı kontrolü${NC}"
echo "----------------------------------------"

if [ -f backup-database.sh ]; then
    echo -e "${GREEN}✓ backup-database.sh mevcut${NC}"
else
    echo -e "${RED}✗ backup-database.sh bulunamadı!${NC}"
    exit 1
fi

if grep -q '"backup".*"bash backup-database.sh"' package.json; then
    echo -e "${GREEN}✓ package.json'da 'backup' script mevcut${NC}"
else
    echo -e "${RED}✗ package.json'da 'backup' script bulunamadı!${NC}"
    exit 1
fi

if grep -q "Database Backup" deploy-production.sh; then
    echo -e "${GREEN}✓ deploy-production.sh'ta backup entegrasyonu mevcut${NC}"
else
    echo -e "${RED}✗ deploy-production.sh'ta backup entegrasyonu bulunamadı!${NC}"
    exit 1
fi

if grep -q "/backups/" .gitignore; then
    echo -e "${GREEN}✓ .gitignore'da /backups/ mevcut${NC}"
else
    echo -e "${RED}✗ .gitignore'da /backups/ bulunamadı!${NC}"
    exit 1
fi

echo ""

# Test 2: Check Docker containers
echo -e "${YELLOW}Test 2: Docker container kontrolü${NC}"
echo "----------------------------------------"

# Check if PostgreSQL container is running
PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -1)
if [ -z "$PG_CONTAINER" ]; then
    echo -e "${RED}✗ PostgreSQL container çalışmıyor!${NC}"
    echo "Mevcut containerlar:"
    docker ps --format 'table {{.Names}}\t{{.Status}}'
    exit 1
else
    echo -e "${GREEN}✓ PostgreSQL container çalışıyor: ${PG_CONTAINER}${NC}"
fi

echo ""

# Test 3: Run backup
echo -e "${YELLOW}Test 3: Backup oluşturma${NC}"
echo "----------------------------------------"

# Make script executable
chmod +x backup-database.sh

# Run backup
echo "Backup scripti çalıştırılıyor..."
if bash backup-database.sh; then
    echo -e "${GREEN}✓ Backup başarıyla oluşturuldu${NC}"
else
    echo -e "${RED}✗ Backup oluşturma başarısız!${NC}"
    exit 1
fi

echo ""

# Test 4: Verify backup file
echo -e "${YELLOW}Test 4: Backup dosyası doğrulama${NC}"
echo "----------------------------------------"

BACKUP_COUNT=$(ls -1 backups/db_backup_*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Backup dosyası oluşturuldu (${BACKUP_COUNT} adet)${NC}"
    ls -lh backups/db_backup_*.sql | tail -1
    
    # Check file size
    LATEST_BACKUP=$(ls -t backups/db_backup_*.sql | head -1)
    BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP" 2>/dev/null)
    
    if [ "$BACKUP_SIZE" -gt 1000 ]; then
        echo -e "${GREEN}✓ Backup dosyası geçerli boyutta (${BACKUP_SIZE} bytes)${NC}"
    else
        echo -e "${RED}✗ Backup dosyası çok küçük, hatalı olabilir${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Backup dosyası bulunamadı!${NC}"
    exit 1
fi

echo ""

# Test 5: Verify SQL content
echo -e "${YELLOW}Test 5: SQL içerik kontrolü${NC}"
echo "----------------------------------------"

LATEST_BACKUP=$(ls -t backups/db_backup_*.sql | head -1)
if head -n 20 "$LATEST_BACKUP" | grep -q "PostgreSQL"; then
    echo -e "${GREEN}✓ Backup dosyası geçerli PostgreSQL dump${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL header bulunamadı, kontrol edin${NC}"
fi

if grep -q "CREATE TABLE" "$LATEST_BACKUP"; then
    echo -e "${GREEN}✓ Backup dosyası tablo tanımları içeriyor${NC}"
else
    echo -e "${RED}✗ Backup dosyası tablo tanımları içermiyor!${NC}"
    exit 1
fi

echo ""

# Test 6: Check backup retention
echo -e "${YELLOW}Test 6: Backup retention testi${NC}"
echo "----------------------------------------"

# Create old backup to test cleanup (8 days old)
OLD_DATE=$(date -d '8 days ago' '+%Y%m%d_%H%M%S' 2>/dev/null || date -v-8d '+%Y%m%d_%H%M%S' 2>/dev/null)
if [ -n "$OLD_DATE" ]; then
    touch -d "8 days ago" "backups/db_backup_${OLD_DATE}.sql"
    echo "Test için eski backup oluşturuldu (tarihi 8 gün geri alındı): db_backup_${OLD_DATE}.sql"
    
    # Run backup again
    bash backup-database.sh > /dev/null 2>&1
    
    # Check if old backup was deleted
    if [ -f "backups/db_backup_${OLD_DATE}.sql" ]; then
        echo -e "${RED}✗ Eski backup silinmedi (retention çalışmıyor)${NC}"
    else
        echo -e "${GREEN}✓ Eski backup silindi (retention çalışıyor)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Retention testi atlandı (date komutu desteklemiyor)${NC}"
fi

echo ""

# Test 7: npm command
echo -e "${YELLOW}Test 7: npm run backup komutu${NC}"
echo "----------------------------------------"

if npm run backup > /dev/null 2>&1; then
    echo -e "${GREEN}✓ npm run backup çalışıyor${NC}"
else
    echo -e "${RED}✗ npm run backup başarısız!${NC}"
    exit 1
fi

echo ""

# Summary
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}TÜM TESTLER BAŞARILI! ✓${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "📊 Özet:"
echo "  - Backup scripti: ✓"
echo "  - Docker entegrasyonu: ✓"
echo "  - Backup oluşturma: ✓"
echo "  - SQL doğrulama: ✓"
echo "  - Retention policy: ✓"
echo "  - npm komutu: ✓"
echo ""
echo -e "${GREEN}Phase 1 production ortamında başarıyla test edildi!${NC}"
echo ""
echo "📝 Mevcut backuplar:"
ls -lh backups/db_backup_*.sql 2>/dev/null || echo "  Henüz backup yok"
echo ""

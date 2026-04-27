#!/bin/bash
# Production Deployment Checklist Script
# Bu script Docker deployment öncesi tüm kritik adımları kontrol eder

set -e

echo "🚀 ParselMonitor Production Deployment Checklist"
echo "=================================================="
echo ""

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Disk Alanı Kontrolü
echo "📊 1. Disk alanı kontrol ediliyor..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo -e "${RED}❌ Disk kullanımı %${DISK_USAGE} - Yüksek!${NC}"
    echo "   Docker temizliği öneriliyor: docker system prune -a -f"
    read -p "Temizlik yapılsın mı? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a -f
        echo -e "${GREEN}✅ Temizlik tamamlandı${NC}"
    fi
else
    echo -e "${GREEN}✅ Disk kullanımı: %${DISK_USAGE}${NC}"
fi
echo ""

# 2. Git Güncelleme
echo "📦 2. Git repository güncelleniyor..."
git fetch origin
BEHIND=$(git rev-list HEAD..origin/master --count)
if [ "$BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $BEHIND commit geride. Git pull yapılıyor...${NC}"
    git pull origin master
else
    echo -e "${GREEN}✅ Repository güncel${NC}"
fi
echo ""

# 3. Environment Variables
echo "🔐 3. Environment variables kontrol ediliyor..."
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env dosyası bulunamadı!${NC}"
    exit 1
fi

# Kritik değişkenleri kontrol et
REQUIRED_VARS=("DATABASE_URL" "AUTH_SECRET" "NEXTAUTH_SECRET")
for VAR in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${VAR}=" .env; then
        echo -e "${RED}❌ ${VAR} bulunamadı!${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Tüm gerekli env variables mevcut${NC}"
echo ""

# 4. Docker Network
echo "🌐 4. Docker network kontrol ediliyor..."
if ! docker network ls | grep -q "projeagent_parselmonitor-network"; then
    echo -e "${YELLOW}⚠️  Network oluşturuluyor...${NC}"
    docker network create projeagent_parselmonitor-network
fi
echo -e "${GREEN}✅ Network hazır${NC}"
echo ""

# 5. PostgreSQL Bağlantısı
echo "🗄️  5. PostgreSQL container kontrol ediliyor..."
if ! docker ps | grep -q "postgresql-postgres-1"; then
    echo -e "${RED}❌ PostgreSQL container çalışmıyor!${NC}"
    exit 1
fi

# Network bağlantısını kontrol et
if ! docker inspect postgresql-postgres-1 | grep -q "projeagent_parselmonitor-network"; then
    echo -e "${YELLOW}⚠️  PostgreSQL network'e bağlanıyor...${NC}"
    docker network connect projeagent_parselmonitor-network postgresql-postgres-1 || true
fi
echo -e "${GREEN}✅ PostgreSQL hazır${NC}"
echo ""

# 6. Database Backup
echo "💾 6. Veritabanı yedekleniyor..."
if [ -f backup-database.sh ]; then
    bash backup-database.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup tamamlandı${NC}"
    else
        echo -e "${YELLOW}⚠️  Backup başarısız oldu ama devam ediliyor...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  backup-database.sh bulunamadı, backup atlanıyor${NC}"
fi
echo ""

# 7. Build
echo "🔨 7. Docker build başlatılıyor..."
docker compose build --no-cache frontend
echo -e "${GREEN}✅ Build tamamlandı${NC}"
echo ""

# 8. Deployment
echo "🚀 8. Containerlar başlatılıyor..."
docker compose up -d
echo ""

# 9. Migration & Seeding
echo "📤 9. Database migration ve seeding..."
sleep 10  # Container'ın ayağa kalkması için bekle

docker exec parselmonitor-frontend npx prisma migrate deploy || docker exec parselmonitor-frontend npx prisma db push --accept-data-loss

# Seed çalıştır
echo "🌱 Seeding database..."
docker exec parselmonitor-frontend npm run seed || echo -e "${YELLOW}⚠️  Seeding failed veya zaten yapılmış${NC}"
echo ""

# 10. Health Check
echo "🏥 10. Health check yapılıyor..."
sleep 5

# Frontend health
FRONTEND_HEALTH=$(docker exec parselmonitor-frontend wget -q -O- http://localhost:3000/api/health || echo "FAILED")
if echo "$FRONTEND_HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Frontend health check geçti${NC}"
else
    echo -e "${RED}❌ Frontend health check başarısız!${NC}"
fi

# Backend health
BACKEND_HEALTH=$(docker exec parselmonitor-backend wget -q -O- http://localhost:8000/health || echo "FAILED")
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend health check geçti${NC}"
else
    echo -e "${RED}❌ Backend health check başarısız!${NC}"
fi
echo ""

# 11. User Kontrol
echo "👤 11. Admin kullanıcı kontrol ediliyor..."
USER_COUNT=$(docker exec postgresql-postgres-1 psql -U mmuser -d parselmonitor -t -c "SELECT COUNT(*) FROM \"User\";" | tr -d ' ')
if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $USER_COUNT kullanıcı mevcut${NC}"
    docker exec postgresql-postgres-1 psql -U mmuser -d parselmonitor -c "SELECT email, role FROM \"User\";"
else
    echo -e "${YELLOW}⚠️  Kullanıcı bulunamadı, seed script çalışmalı${NC}"
fi
echo ""

# 12. Container Status
echo "📋 12. Container durumu:"
docker ps --filter name=parselmonitor --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Özet
echo "=================================================="
echo -e "${GREEN}✅ DEPLOYMENT TAMAMLANDI!${NC}"
echo ""
echo "🔑 GİRİŞ BİLGİLERİ:"
echo "   Email: altanbariscomert@gmail.com"
echo "   Şifre: altan123"
echo ""
echo "🌐 URL: http://$(curl -s ifconfig.me):3000"
echo ""
echo "📝 Logları görmek için:"
echo "   docker logs parselmonitor-frontend --tail 50"
echo "   docker logs parselmonitor-backend --tail 50"
echo "=================================================="

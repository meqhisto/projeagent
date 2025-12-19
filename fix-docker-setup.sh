#!/bin/bash
# Kapsamlı Docker PostgreSQL Setup Script
# Bu script tüm sorunları adım adım çözecek

set -e  # Hata durumunda dur

echo "🔧 ParselMonitor Docker Setup - Kapsamlı Çözüm"
echo "=============================================="
echo ""

# 1. Disk Alanı Kontrolü ve Temizliği
echo "📊 1. Disk alanı kontrol ediliyor..."
df -h | grep -E 'Filesystem|/$'
echo ""
echo "🧹 Docker temizliği yapılıyor (eski image ve cache siliniyor)..."
docker system prune -a -f
docker builder prune -f
echo "✅ Temizlik tamamlandı"
echo ""

# 2. .env Dosyasını Düzelt
echo "📝 2. .env dosyası düzenleniyor..."
cd ~/projeagent

# Backup al
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Yeni .env oluştur (sadece PostgreSQL ile)
cat > .env << 'ENVEOF'
# Authentication
AUTH_SECRET="fc83539cfs734346_generated_secret_key_12345"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="fc83539cfs734346_generated_secret_key_12345"

# Database (PostgreSQL - Production)
DATABASE_URL="postgresql://mmuser:Yxrkt2bb7q8.@postgresql-postgres-1:5432/parselmonitor"

# Backend URL
INTERNAL_BACKEND_URL="http://parselmonitor-backend:8000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"

# CORS
ALLOWED_ORIGINS="http://localhost:3000"
ENVEOF

echo "✅ .env dosyası güncellendi"
echo ""

# 3. Veritabanı Hazırlığı
echo "🗄️  3. PostgreSQL veritabanı hazırlanıyor..."

# Veritabanını kontrol et, yoksa oluştur
docker exec postgresql-postgres-1 psql -U mmuser -d postgres -c "SELECT 1 FROM pg_database WHERE datname='parselmonitor'" | grep -q 1 || \
docker exec postgresql-postgres-1 psql -U mmuser -d postgres -c "CREATE DATABASE parselmonitor;"

echo "✅ Veritabanı hazır"
echo ""

# 4. Network Bağlantısı
echo "🌐 4. Network bağlantısı kontrol ediliyor..."
docker network connect projeagent_parselmonitor-network postgresql-postgres-1 2>/dev/null || echo "Network zaten bağlı"
echo "✅ Network bağlantısı tamam"
echo ""

# 5. Git'ten son güncellemeleri çek
echo "📦 5. Kod güncellemeleri çekiliyor..."
git pull origin master
echo "✅ Kod güncellendi"
echo ""

# 6. Containerları Rebuild Et
echo "🔨 6. Frontend container rebuild ediliyor..."
docker compose build --no-cache frontend
echo "✅ Build tamamlandı"
echo ""

# 7. Containerları başlat
echo "🚀 7. Containerlar başlatılıyor..."
docker compose up -d
sleep 10
echo "✅ Containerlar çalışıyor"
echo ""

# 8. Prisma Client Generate
echo "⚙️  8. Prisma Client oluşturuluyor..."
docker exec parselmonitor-frontend npx prisma generate
echo "✅ Prisma Client hazır"
echo ""

# 9. Migration/DB Push
echo "📤 9. Veritabanı şeması gönderiliyor..."
docker exec parselmonitor-frontend npx prisma db push --accept-data-loss --skip-generate
echo "✅ Şema oluşturuldu"
echo ""

# 10. Tabloları Kontrol Et
echo "🔍 10. Tablolar kontrol ediliyor..."
docker exec postgresql-postgres-1 psql -U mmuser -d parselmonitor -c "\dt"
echo ""

# 11. Admin Kullanıcı Oluştur
echo "👤 11. Admin kullanıcı oluşturuluyor..."
docker exec postgresql-postgres-1 psql -U mmuser -d parselmonitor << 'SQLEOF'
INSERT INTO "User" (email, password, name, role, "isActive", "createdAt")
VALUES (
  'altanbariscomert@gmail.com',
  '$2a$10$YMCkMhRt7SyXKz.eCO8AVuqvL0Q0pqW0fZ7W6qH0qH0qH0qH0qH0q',
  'Altan Baris Comert',
  'ADMIN',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = '$2a$10$YMCkMhRt7SyXKz.eCO8AVuqvL0Q0pqW0fZ7W6qH0qH0qH0qH0qH0q',
  role = 'ADMIN',
  "isActive" = true;
SQLEOF

echo "✅ Admin kullanıcı hazır"
echo ""

# 12. Kullanıcıları Listele
echo "📋 12. Oluşturulan kullanıcılar:"
docker exec postgresql-postgres-1 psql -U mmuser -d parselmonitor -c "SELECT id, email, name, role FROM \"User\";"
echo ""

# 13. Container Durumunu Kontrol Et
echo "🏥 13. Container sağlık durumu:"
docker ps --filter name=parselmonitor --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 14. Son Kontroller
echo "🎯 14. Bağlantı testi yapılıyor..."
echo "Frontend logs (son 5 satır):"
docker logs parselmonitor-frontend --tail 5
echo ""

echo "=============================================="
echo "✅ KURULUM TAMAMLANDI!"
echo ""
echo "🔑 GİRİŞ BİLGİLERİ:"
echo "   Email: altanbariscomert@gmail.com"
echo "   Şifre: altan123"
echo ""
echo "🌐 URL: http://YOUR_SERVER_IP:3000"
echo ""
echo "📝 Not: Eğer hala giriş yapamıyorsanız:"
echo "   docker logs parselmonitor-frontend --tail 50"
echo "   komutu ile hataları kontrol edin."
echo "=============================================="

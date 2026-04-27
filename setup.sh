#!/bin/bash

# ParselMonitor Setup Script
# Bu script projeyi Docker üzerinde otomatik olarak kurar ve başlatır.

echo "🚀 ParselMonitor Kurulumu Başlatılıyor..."

# 1. Docker Kontrolü
if ! command -v docker &> /dev/null; then
    echo "❌ Docker bulunamadı! Lütfen önce Docker'ı yükleyin."
    exit 1
fi

# Docker Compose komutunu belirle (v1 vs v2)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ docker-compose veya 'docker compose' bulunamadı! Lütfen Docker Compose eklentisini yükleyin."
    echo "Ubuntu için: sudo apt-get install docker-compose-plugin"
    exit 1
fi
echo "✅ Kullanılan Docker Compose komutu: $DOCKER_COMPOSE_CMD"

# 2. .env Dosyası Kontrolü
if [ ! -f .env ]; then
    echo "⚠️ .env dosyası bulunamadı. Varsayılan ayarlarla oluşturuluyor..."
    cat <<EOT >> .env
DATABASE_URL="file:/app/prisma/dev.db"
AUTH_SECRET="fc83539cfs734346_generated_secret_key_12345"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="fc83539cfs734346_generated_secret_key_12345"
EOT
    echo "✅ .env oluşturuldu."
else
    echo "✅ .env dosyası mevcut."
fi

# 3. Docker Konteynerlerini Başlatma
echo "📦 Konteynerler derleniyor ve başlatılıyor (bu işlem biraz sürebilir)..."
$DOCKER_COMPOSE_CMD up --build -d

if [ $? -eq 0 ]; then
    echo "✅ Konteynerler başarıyla başlatıldı."
else
    echo "❌ Konteynerler başlatılamadı."
    exit 1
fi

# 4. Veritabanı Hazırlığı (Opsiyonel: Eğer volume boşsa)
echo "🗄️ Veritabanı kontrol ediliyor..."
# Docker içinde migration ve seed işlemini tetikleyebiliriz
$DOCKER_COMPOSE_CMD exec -T frontend npx prisma migrate deploy
$DOCKER_COMPOSE_CMD exec -T frontend npx prisma generate

# Kullanıcı oluşturma (Seed)
echo "👤 Varsayılan kullanıcılar oluşturuluyor..."
$DOCKER_COMPOSE_CMD exec -T frontend npx tsx prisma/seed.ts

echo "----------------------------------------------------------------"
echo "🎉 Kurulum Tamamlandı!"
echo "👉 Frontend: http://localhost:3000"
echo "👉 Backend:  http://localhost:8000"
echo "----------------------------------------------------------------"

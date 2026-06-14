# ParselMonitor

Türkiye gayrimenkul piyasasına yönelik kapsamlı arsa ve parsel yönetim platformu. TKGM MEGSİS entegrasyonu, interaktif harita, CRM pipeline, müteahhit fizibilite hesaplayıcı ve yatırımcı sunum sistemi içerir.

---

## Özellikler

### Parsel Yönetimi
- TKGM MEGSİS v3.1 API üzerinden **İl → İlçe → Mahalle** kademeli dropdown ile otomatik koordinat, alan ve GeoJSON geometri çekme
- Ada / Parsel bazlı kayıt; kategori, etiket, imar bilgisi (KAKS, TAKS, Hmax), durum ve CRM aşaması takibi
- JSON / GeoJSON toplu içe aktarma
- Parsel bazlı belge ve fotoğraf yönetimi
- Emsal analizi (bölge bazlı fiyat karşılaştırması)

### Harita
- **Leaflet + React-Leaflet** tabanlı interaktif harita
- TKGM'den çekilen GeoJSON poligon geometrisini doğrudan haritada gösterme
- Kümelenmiş pin görünümü (MarkerCluster)
- Koordinatlı parseller için anlık konum pini

### CRM & Pipeline
- Kanban tahtası: `Yeni Lead → İletişim → Analiz → Teklif → Sözleşme → Kaybedildi`
- Müşteri / paydaş yönetimi (arsa sahibi, yatırımcı, danışman)
- Görev ve hatırlatma sistemi (öncelik, vade tarihi, atama)
- Etkileşim geçmişi (arama, toplantı, teklif, not)

### Müteahhit Fizibilite Hesaplayıcı
- **Kat Karşılığı İnşaat** modeli için tam hesap motoru (TypeScript, ek backend gerektirmez)
- Girdi: arsa m², emsal, kat karşılığı oranı, daire büyüklüğü, inşaat / satış m² fiyatı
- Çıktı: toplam / müteahhit / arsa sahibi daire dağılımı, net kâr, ROI, şerefiye optimizasyonu, 18 aylık nakit akış simülasyonu, arsa sahibi teklif metni
- Hesaplama geçmişi ve karşılaştırma

### Gayrimenkul Portföyü
- Daire, villa, ofis, dükkan ve arsa mülk yönetimi
- Alt birim (daire / ofis) takibi ve kiracı bağlantısı
- Finansal işlemler: kira geliri, gider, bakım, vergi
- Değerleme geçmişi

### Müteahhit Defteri
- Firma kartı: yetkili, iletişim, vergi no, uzmanlık alanları
- Güvenilirlik / kalite / iletişim / fiyat bazında puanlama sistemi
- Parsel–firma eşleştirme ve müzakere aşaması takibi

### Yatırımcı Sunum Sistemi
- Parsel bazlı profesyonel sunum oluşturma
- Token tabanlı, süre sınırlı paylaşılabilir bağlantı
- Görüntülenme sayacı

### Yönetim Paneli
- Kullanıcı yönetimi (rol: USER / ADMIN)
- Tüm sistem genelinde parsel görünümü
- Audit log: giriş, CRUD işlemleri, export, başarısız oturum denemeleri

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide React |
| Harita | Leaflet, React-Leaflet, Leaflet MarkerCluster |
| Grafik | Recharts |
| ORM | Prisma 5.22 |
| Veritabanı | PostgreSQL |
| Auth | NextAuth.js v5 (credentials) |
| Validasyon | Zod v4 |
| Test | Vitest, Playwright |
| Deployment | Docker, Docker Compose |

---

## Hızlı Başlangıç

### Gereksinimler

- Node.js 20+
- pnpm
- PostgreSQL 15+

### Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle

# Veritabanı şemasını oluştur
npx prisma db push

# (İsteğe bağlı) Örnek veri yükle
pnpm seed

# Geliştirme sunucusunu başlat
pnpm dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

---

## Ortam Değişkenleri

```env
# Veritabanı
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/parselmonitor"

# NextAuth
NEXTAUTH_SECRET="guclu-bir-gizli-anahtar"
NEXTAUTH_URL="http://localhost:3000"

# (İsteğe bağlı) Docker içi backend URL
INTERNAL_BACKEND_URL="http://localhost:8888"
```

---

## Docker ile Deployment

```bash
# Tüm servisleri ayağa kaldır
docker compose up -d

# Logları takip et
docker compose logs -f frontend
```

`docker-compose.yml` içindeki servisler:

| Servis | Port | Açıklama |
|---|---|---|
| `frontend` | 3000 | Next.js uygulaması |
| `backend` | 8000 | Python FastAPI (opsiyonel ek hesaplama servisi) |

> Müteahhit fizibilite hesaplayıcı (`/api/calculate/strict`) artık doğrudan Next.js içinde TypeScript olarak çalışmaktadır; Python backend zorunlu değildir.

---

## Proje Yapısı

```
├── app/
│   ├── api/
│   │   ├── calculate/strict/   # Müteahhit fizibilite hesap motoru (TS)
│   │   ├── parcels/            # Parsel CRUD + hesaplama geçmişi
│   │   ├── tkgm/               # TKGM MEGSİS proxy (il/ilçe/mahalle/lookup)
│   │   └── proxy/              # Python backend proxy
│   ├── map/                    # Harita sayfası
│   ├── parcels/                # Parsel liste ve detay sayfaları
│   ├── pipeline/               # CRM Kanban tahtası
│   ├── contractors/            # Müteahhit yönetimi
│   ├── customers/              # Müşteri yönetimi
│   ├── properties/             # Gayrimenkul portföyü
│   ├── tasks/                  # Görev yönetimi
│   └── admin/                  # Yönetim paneli
├── components/                 # Yeniden kullanılabilir UI bileşenleri
├── prisma/
│   ├── schema.prisma           # Veritabanı şeması
│   └── seed.ts                 # Örnek veri
├── lib/                        # Yardımcı fonksiyonlar, validasyon şemaları
├── types/                      # TypeScript tip tanımlamaları
└── backend/                    # Python FastAPI (opsiyonel)
    └── app/
        ├── main.py
        └── calculator.py
```

---

## TKGM Entegrasyonu

TKGM MEGSİS v3.1 API'si WAF korumalı olduğundan tüm istekler Next.js API route'ları üzerinden proxy'lenir:

| Endpoint | Açıklama |
|---|---|
| `GET /api/tkgm/ilceler/[ilId]` | Seçilen ile ait ilçe listesi |
| `GET /api/tkgm/mahalleler/[ilceId]` | Seçilen ilçeye ait mahalle listesi |
| `GET /api/tkgm/lookup` | Parsel alanı, koordinat ve GeoJSON geometrisi |

Parsel eklenirken TKGM'den çekilen GeoJSON poligonu veritabanına kaydedilir ve haritada doğrudan render edilir.

---

## Kullanışlı Komutlar

```bash
# Şifre sıfırlama
pnpm reset-password

# Veritabanı yedeği
pnpm backup

# Birim testleri
pnpm test

# E2E testleri (Playwright)
pnpm test:e2e

# Kapsam raporu
pnpm test:coverage
```

---

## Lisans

Bu proje özel kullanım içindir.

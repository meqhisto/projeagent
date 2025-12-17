# 🏗️ ParselMonitor - İnşaat Arsa Yönetim Sistemi

**Version:** 1.1.0  
**Status:** Production Ready  
**License:** MIT  
**Last Updated:** 17 Aralık 2025

Modern, güvenli ve kullanıcı dostu **arsa takip ve analiz platformu**. Gayrimenkul profesyonelleri için tasarlanmış, tam özellikli CRM ve fizibilite analiz sistemi.

## 🆕 Yeni Özellikler (v1.1.0)

- ✅ **Self-Service Şifre Değiştirme:** Kullanıcılar artık kendi şifrelerini değiştirebiliyor
- ✅ **Sekmeli Parsel Detay:** 4 sekme ile organize görünüm (Genel, Müteahhit, CRM, Dökümanlar)
- ✅ **Müşteri Detay Sayfası:** Kapsamlı müşteri profilleri ve görüşme geçmişi
- ✅ **Geliştirilmiş CRM:** Tıklanabilir müşteri kartları ve timeline görünümü

---

## 🎯 Özellikler

### 🏘️ Parsel Yönetimi
- **Detaylı Parsel Kartları:** Ada, parsel, mahalle, şehir, yüz ölçümü
- **İmar Bilgileri:** KAKS (emsal), TAKS, kat adedi, irtifa
- **Görsel Yönetim:** Çoklu görsel yükleme, varsayılan görsel seçimi
- **Doküman Yökleme:** PDF, Word, Excel vb. dosya desteği
- **Google Maps Entegrasyonu:** Konum görüntüleme ve arama

### 📊 CRM & Pipeline Yönetimi
- **Satış Boru Hattı:** Drag & drop kanban board
- **CRM Aşamaları:**
  - 🆕 Yeni Fırsat (NEW_LEAD)
  - 📞 Görüşülüyor (CONTACTED)
  - 🔍 Analiz Yapıldı (ANALYSIS)
  - 📝 Teklif Verildi (OFFER_SENT)
  - ✅ Sözleşme/Kapora (CONTRACT)
  - ❌ Kaybedildi (LOST)
- **Hot Leads:** Yüksek öncelikli fırsatlar
- **Müşteri Takibi:** Detaylı müşteri profilleri

### 📈 Analiz & Raporlama
- **Fizibilite Hesaplama:**
  - Kat karşılığı simülasyonu
  - Maliyet-gelir analizi
  - ROI hesaplama
  - Nakit akış projeksiyonu
  - Şerefiye optimizasyonu
- **Dashboard KPI'lar:**
  - Toplam parsel sayısı
  - Aktif fırsatlar
  - Dönüşüm oranı
  - Ortalama ROI
  - Aylık bazda ekleme trendi
- **Grafikler:**
  - Pipeline dağılımı (pasta grafik)
  - Aylık trend (çizgi grafik)
- **PDF Rapor İhracı:** Detaylı parsel raporları

### 🗺️ Görselleştirme
- **İnteraktif Harita:** Leaflet.js ile marker bazlı görünüm
- **Kanban Board:** Satış aşamalarına göre görselleştirme
- **Filtreleme & Arama:**
  - Şehir, ilçe, mahalle
  - Alan aralığı (min-max)
  - CRM aşaması
  - İmar durumu

### 🔐 Güvenlik & Auth
- **NextAuth.js:** Güvenli kimlik doğrulama
- **Rol Bazlı Yetkilendirme:** Admin, Agent, Viewer
- **Bcrypt:** Şifre hashleme
- **Self-Service Şifre Değiştirme:** Kullanıcılar kendi şifrelerini güncelleyebilir
- **Password Strength Meter:** Gerçek zamanlı şifre gücü göstergesi
- **CORS Koruması:** Whitelist bazlı
- **Health Check Endpoints:** Sistem durumu izleme

### 🎨 Modern UI/UX
- **Responsive Design:** Mobil, tablet, desktop
- **Dark Mode Ready:** Premium tasarım
- **Animasyonlar:** Smooth transitions
- **Accessibility:** ARIA labels, keyboard navigation

---

## 🛠️ Teknoloji Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS 3
- **State Management:** React Hooks
- **Maps:** Leaflet.js
- **Charts:** Recharts
- **Drag & Drop:** @hello-pangea/dnd
- **Authentication:** NextAuth.js v5

### Backend
- **Framework:** FastAPI (Python 3.9)
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **API:** RESTful
- **Health Checks:** Built-in monitoring

### DevOps
- **Containerization:** Docker, Docker Compose
- **Reverse Proxy:** Nginx Proxy Manager
- **SSL:** Let's Encrypt (auto-renewal)
- **CI/CD:** GitHub Actions ready

---

## 📦 Kurulum

### Gereksinimler
- Node.js 20+
- Python 3.9+
- Docker & Docker Compose (production)
- Git

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/meqhisto/projeagent.git
cd projeagent
```

### 2. Environment Variables
```bash
# .env dosyasını oluşturun
cp .env.example .env

# Gerekli değerleri doldurun:
# - AUTH_SECRET (openssl rand -hex 32)
# - NEXTAUTH_SECRET (openssl rand -hex 32)
# - DATABASE_URL
```

### 3a. Local Development
```bash
# Frontend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Backend (ayrı terminal)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Erişim:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3b. Docker Production Deployment
```bash
# Tek komutla başlat
./setup.sh

# Veya manuel:
docker compose up -d --build
```

**Container'lar:**
- `parselmonitor-frontend` → Port 3000
- `parselmonitor-backend` → Port 8000

---

## 🚀 Production Deployment

### Nginx Proxy Manager ile SSL Setup

1. **Container'ları Başlatın:**
```bash
docker compose up -d
```

2. **Nginx Network Bağlantısı:**
```bash
docker network connect projeagent_parselmonitor-network nginx-proxy-manager
```

3. **Nginx Proxy Manager Paneli:**
   - URL: `http://your-server-ip:8100`
   - Login: `admin@example.com` / `changeme`

4. **Proxy Host Ekleyin:**
   - Domain: `yourdomain.com`
   - Forward Hostname: `parselmonitor-frontend`
   - Forward Port: `3000`
   - SSL: Request Let's Encrypt Certificate ✅

5. **Test:**
```bash
curl https://yourdomain.com
```

---

## 📖 Kullanım

### İlk Giriş
1. Ana sayfada kayıt olun veya giriş yapın
2. Dashboard'da genel istatistikleri görün
3. "Yeni Parsel Ekle" butonuyla ilk parseli oluşturun

### Parsel Ekleme
1. **Parsel Bilgileri:** Ada, parsel, şehir, ilçe, mahalle
2. **İmar Durumu:** KAKS, TAKS, kat adedi (opsiyonel)
3. **Görseller:** Drag & drop ile yükleyin
4. **Dokümanlar:** İlgili evrakları ekleyin

### Fizibilite Analizi
1. Parsel detay sayfasına gidin
2. "Müteahhit Hesabı (Kat Karşılığı)" bölümünü genişletin
3. Parametreleri girin:
   - Arsa m²
   - Emsal (KAKS)
   - Kat karşılığı oranı (örn: 0.50 = %50)
   - Daire brütü
   - İnşaat maliyeti/m²
   - Satış fiyatı/m²
4. "Hesapla" butonuna tıklayın
5. Detaylı raporu görüntüleyin:
   - Fiziksel özet
   - Finansal tablo
   - Şerefiye analizi
   - Nakit akış simülasyonu

### CRM Yönetimi
1. **Pipeline View:** Satış aşamalarını görüntüleyin
2. **Drag & Drop:** Kartları aşamalar arasında sürükleyin
3. **Hot Leads:** Yüksek değerli fırsatları takip edin
4. **Kanban Board:** Organize görünüm

---

## 🔧 API Endpoints

### Frontend (Next.js API Routes)
- `GET /api/parcels` - Tüm parselleri listele
- `POST /api/parcels` - Yeni parsel ekle
- `GET /api/parcels/[id]` - Parsel detayları
- `PATCH /api/parcels/[id]` - Parsel güncelle
- `DELETE /api/parcels/[id]` - Parsel sil
- `GET /api/analytics/kpis` - Dashboard KPI'lar
- `GET /api/analytics/pipeline` - Pipeline verileri
- `GET /api/health` - Health check

### Backend (FastAPI)
- `GET /health` - Health check
- `POST /calculate/basic` - Basit hesaplama (alan x emsal)
- `POST /calculate/strict` - Kat karşılığı analizi
- `GET /docs` - Swagger API documentation

---

## 📁 Proje Yapısı

```
projeagent/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── parcels/              # Parsel sayfaları
│   ├── pipeline/             # CRM pipeline
│   ├── map/                  # Harita görünümü
│   └── kanban/               # Kanban board
├── components/               # React komponenler
│   ├── AddParcelModal.tsx
│   ├── FeasibilitySection.tsx
│   ├── ProcessTimeline.tsx
│   └── ...
├── lib/                      # Utilities
│   └── logger.ts
├── prisma/                   # Database schema
│   └── schema.prisma
├── backend/                  # FastAPI backend
│   └── app/
│       ├── main.py           # FastAPI app
│       └── calculator.py     # Fizibilite engine
├── public/                   # Static assets
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Frontend container
├── backend/Dockerfile        # Backend container
└── setup.sh                  # Quick setup script
```

---

## 🐳 Docker Configuration

### Container Names
- **Frontend:** `parselmonitor-frontend`
- **Backend:** `parselmonitor-backend`

### Networks
- **Internal:** `projeagent_parselmonitor-network`
- **Nginx Integration:** Manually connect nginx to internal network

### Volumes
- `node_modules` - Frontend dependencies (persistent)

### Health Checks
- Frontend: `curl http://localhost:3000/api/health`
- Backend: `curl http://localhost:8000/health`

---

## 🔒 Security Best Practices

### ✅ Implemented
- [x] Environment-based secrets (no hardcoded credentials)
- [x] CORS whitelist (not wildcard)
- [x] Bcrypt password hashing
- [x] NextAuth.js session management
- [x] Health check endpoints
- [x] Docker container isolation

### 🎯 Recommended for Production
- [ ] Rate limiting on API endpoints
- [ ] Security headers (CSP, X-Frame-Options)
- [ ] PostgreSQL database (instead of SQLite)
- [ ] Regular backup automation
- [ ] SSL/TLS encryption (via Nginx Proxy Manager)
- [ ] Monitoring & logging (e.g., Sentry)

---

## 📊 Performance

### Build Time
- **Frontend:** ~2-3 minutes
- **Backend:** ~30 seconds (minimal dependencies)
- **Total Docker Build:** ~3-4 minutes

### Bundle Size
- **Frontend:** ~400 KB (gzipped)
- **Backend Image:** ~150 MB

### Response Time
- **API Average:** <100ms
- **Page Load:** <1s (after initial load)

---

## 🐛 Troubleshooting

### Docker 502 Bad Gateway
```bash
# Nginx container'ını ParselMonitor network'üne bağlayın
docker network connect projeagent_parselmonitor-network nginx-proxy-manager
```

### Database Migration Errors
```bash
# Prisma client'ı yeniden generate edin
npx prisma generate
npx prisma db push
```

### Port Already in Use
```bash
# Çakışan process'i bulun ve durdurun
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
```

### Build Fails (Disk Space)
```bash
# Docker cache'i temizleyin
docker system prune -a --volumes -f
```

---

## 🗺️ Roadmap

### v1.1.0 (Planned)
- [ ] PostgreSQL migration guide
- [ ] Advanced filtering & search
- [ ] Email notifications
- [ ] Export to Excel/CSV

### v1.2.0 (Future)
- [ ] Multi-language support (EN, TR)
- [ ] Mobile app (React Native)
- [ ] AI-powered price predictions
- [ ] Integration with Turkish Land Registry API

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Developed by:** Altan Barış Cömert  
**GitHub:** [@meqhisto](https://github.com/meqhisto)  
**Version:** 1.0.1  
**Last Updated:** December 2024

---

## 📞 Support

For issues and questions:
- **GitHub Issues:** [Create an issue](https://github.com/meqhisto/projeagent/issues)
- **Documentation:** See `/docs` folder (coming soon)

---

**⭐ Star this repository** if you find it useful!

Built with ❤️ using Next.js, FastAPI, and Docker.

# CLAUDE.md

Bu dosya, Claude Code'a (claude.ai/code) bu repoda çalışırken rehberlik eder.

## Projeye Genel Bakış

**ParselMonitor**, gayrimenkul profesyonelleri için geliştirilmiş bir Türk taşınmaz yönetim platformudur. TKGM (Tapu ve Kadastro Genel Müdürlüğü) API'lerine entegre olur; arsa parselleri için CRM boru hattı yönetimi, müteahhit eşleştirme, fizibilite hesabı (Kat Karşılığı İnşaat) ve yatırımcı sunum sistemi içerir.

Teknoloji yığını: Next.js 16 App Router + React 19 + Tailwind CSS v4 + Prisma 5 + PostgreSQL + NextAuth v5. `backend/` dizininde opsiyonel bir Python FastAPI arka ucu bulunur.

## Komutlar

```bash
# Geliştirme
npm run dev              # Dev sunucusunu başlat

# Derleme
npm run build            # prisma generate + next build
npm start                # Production sunucusunu başlat

# Linting
npm run lint             # ESLint (eslint.config.mjs)

# Birim testleri (Vitest + jsdom)
npm test                 # Tüm testleri bir kez çalıştır
npm run test:watch       # İzleme modu
npm run test:coverage    # Kapsam raporu
npx vitest run __tests__/components/MyComponent.test.tsx  # Tek dosya testi

# E2E testleri (Playwright, yalnızca Chromium)
npm run test:e2e         # Dev sunucu gerektirir ya da otomatik başlatır

# Veritabanı
npx prisma generate      # Şema değişikliklerinden sonra client'ı yeniden üret
npx prisma db push       # Şemayı DB'ye uygula (geliştirme)
npx prisma migrate dev --name <isim>  # Adlandırılmış migration oluştur
npm run seed             # Örnek veri yükle (prisma/seed.ts)
npm run reset-password   # Etkileşimli şifre sıfırlama (prisma/reset-password.ts)
```

Mevcut olduğunda `pnpm` kullanın; yoksa `npm` (package-lock.json mevcuttur).

## Mimari

### Kimlik Doğrulama ve Yetkilendirme

- **NextAuth v5** (`auth.config.ts`) JWT stratejisini ve Credentials provider'ı (e-posta + bcryptjs şifre) kullanır.
- `middleware.ts`, `/login`, `/register`, `/public/*`, `/p/*` (kamuya açık sunumlar) ve `/api/auth/*`, `/api/webhooks/*`, `/api/presentation/*` dışındaki tüm rotaları korur.
- `lib/auth/roleCheck.ts`, her API rotasında kullanılan guard fonksiyonlarını dışa aktarır:
  - `requireAuth()` — oturum yoksa hata fırlatır, session user döndürür
  - `requireAdmin()` — ek olarak `role === "ADMIN"` koşulunu denetler
  - `getUserId()` / `resolveUserId()` — JWT'den sayısal DB kullanıcı ID'sini çözer (eski token'lar için e-posta aramasına düşer)
- Session token şunları içerir: `id` (sayısal string), `email`, `name`, `role` (`USER` | `ADMIN`).

### API Rota Kuralları

Tüm rotalar `app/api/` altındadır. Her handler şunları yapmalıdır:
1. Başında `requireAuth()` veya `requireAdmin()` çağır
2. Request body'i `lib/validations.ts`'deki Zod şemasıyla `validateSchema<T>(schema, data)` kullanarak doğrula — `{ success, data?, errors? }` döndürür
3. Yazma işlemleri için `lib/auditLog.ts`'den `auditLog()` çağır
4. POST/yazma endpoint'lerinde `lib/rateLimit.ts` ile hız sınırı uygula

### Veri Modeli (Prisma)

Temel modeller ve ilişkileri:
- **Parcel** — merkezi varlık. `ownerId` (oluşturan) ve opsiyonel `assignedTo` içerir. `(ownerId, city, district, neighborhood, island, parsel)` üzerinde benzersizdir. CRM aşamaları: `NEW_LEAD → CONTACTED → ANALYSIS → OFFER_SENT → CONTRACT → LOST`.
- **Parcel görünürlüğü**: Kullanıcı; sahibi olduğu, atandığı veya `ParcelShare` (VIEW ya da EDIT) aracılığıyla erişim verilmiş parselleri görür.
- **ZoningInfo** — Parcel ile 1:1 ilişki; KAKS (Emsal), TAKS, Hmax değerlerini saklar.
- **Interaction** — Parsel'e bağlı görevler/aramalar/toplantılar/teklifler.
- **Customer** — arazi sahibi, yatırımcı, acente veya diğer paydaşlar.
- **Contractor** + **ContractorRating** + **ContractorParcelMatch** — müteahhit sicili ve eşleştirme iş akışı.
- **FeasibilityCalculation** — `POST /api/calculate/strict` hesaplama sonuçlarını JSON olarak saklar.
- **PresentationShare** — süre sonu ve görüntülenme sayacı içeren token tabanlı yatırımcı sunum linkleri. Kamuya açık rotalar: `/p/[token]` ve `/api/presentation/[token]`.
- **AuditLog** — güvenlik denetim izi; LOGIN, CREATE, UPDATE, DELETE, EXPORT, FAILED_LOGIN işlemlerini IP ve user agent ile kaydeder.

### Arka Plan İşleme

Parsel oluşturulduğunda `lib/jobs/process_parcel.ts` asenkron olarak tetiklenir:
1. `lib/agents/visual_fetcher.ts` — Puppeteer/Chromium ile harita/uydu görüntülerini çeker ve `Image` kayıtlarına yazar.
2. `lib/agents/zoning_researcher.ts` — Web araması ve Cheerio ile KAKS, TAKS imar bilgisini kazır, `ZoningInfo`'yu günceller.
3. Parsel `status` geçişi: `PENDING → RESEARCHING → COMPLETED`.

### TKGM Entegrasyonu

`app/api/tkgm/` Tapu ve Kadastro Genel Müdürlüğü MEGSİS v3.1 API'sini proxy'ler:
- `GET /api/tkgm/ilceler/[ilId]` — ile göre ilçeler
- `GET /api/tkgm/mahalleler/[ilceId]` — ilçeye göre mahalleler
- `GET /api/tkgm/lookup` — parsel geometrisi (GeoJSON polygon) ve koordinatları

### Haritalar

Leaflet + React-Leaflet v5. GeoJSON polygon sınırları `Parcel.geometry`'de JSON string olarak saklanır. Yoğun harita görünümleri için MarkerCluster kullanılır. Leaflet yalnızca istemci tarafında yüklenmelidir (`ssr: false` ile dinamik import).

### Fizibilite Hesaplayıcısı

`POST /api/calculate/strict`, Kat Karşılığı İnşaat hesabını uygular: 18 aylık nakit akışı, ROI ve kâr dağılımı `FeasibilityCalculation.result`'ta JSON olarak saklanır.

### Doğrulama

Tüm Zod şemaları `lib/validations.ts` içindedir. Başlıca şemalar:
- `ParcelCreateSchema` / `ParcelUpdateSchema`
- `CustomerCreateSchema`
- `TaskCreateSchema`
- `ZoningUpdateSchema`
- `ChangePasswordSchema` (8+ karakter, büyük harf, küçük harf, rakam)

Sayısal alanlar `string | number | null` kabul eder ve `parseFloat` ile dönüştürülür.

### Testler

- **Birim testleri**: `__tests__/` — Vitest + jsdom. `vitest.setup.ts` dosyasında `next/navigation` ve `next-auth/react` mock'lanır.
- **E2E testleri**: `tests/e2e/` — Playwright. Sayfa nesneleri `tests/e2e/pages/` altındadır. Temel URL: `http://localhost:3000`.

## Ortam Değişkenleri

```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/parselmonitor"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Opsiyonel
INTERNAL_BACKEND_URL="http://localhost:8888"   # Python FastAPI
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="https://ekip.invecoproje.com"
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"  # Docker/Linux
```

## Alan Terminolojisi

- **Ada** = kadastro ada numarası; **Parsel** = parsel numarası — ikisi birlikte bir Türk taşınmazını benzersiz şekilde tanımlar
- **KAKS / Emsal** = kat alanı katsayısı; **TAKS** = taban alanı katsayısı; **Hmax** = maksimum bina yüksekliği
- **Kat Karşılığı İnşaat** = müteahhidin kâr paylaşımlı inşaat modeli
- **TKGM** = Tapu ve Kadastro Genel Müdürlüğü
- Tüm arayüz metinleri ve doğrulama hata mesajları Türkçedir

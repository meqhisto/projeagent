---
description: Genel kod yazma ve geliştirme workflow'u - yeni özellik ekleme, bug fix, refactoring için standart adımlar
---

# Genel Kod Workflow'u

Bu workflow, herhangi bir kod değişikliği yaparken takip edilmesi gereken standart adımları tanımlar.

---

## 1. Analiz ve Planlama

### 1.1 Gereksinim Analizi
- [ ] Kullanıcı talebini tam olarak anla
- [ ] Mevcut kodu incele ve etki alanını belirle
- [ ] Bağımlılıkları tespit et

### 1.2 Dosya Keşfi
```bash
# İlgili dosyaları bul
// turbo
find . -name "*.tsx" -o -name "*.ts" | head -20
```

### 1.3 Mevcut Kod İncelemesi
- İlgili dosyaları `view_file` ile incele
- Mevcut pattern'leri ve yapıyı anla
- Kod stilini not al

---

## 2. Uygulama

### 2.1 Kod Yazma Kuralları
- **Tutarlılık**: Mevcut kod stiliyle uyumlu ol
- **Modülerlik**: Küçük, yeniden kullanılabilir fonksiyonlar yaz
- **Okunabilirlik**: Açık ve anlaşılır isimler kullan
- **DRY Prensibi**: Tekrar eden kodu minimize et

### 2.2 Dosya Değişiklikleri
1. Önce mevcut dosyayı oku
2. Değişiklikleri planla
3. `replace_file_content` veya `multi_replace_file_content` kullan
4. Yeni dosyalar için `write_to_file` kullan

### 2.3 Import ve Dependency Yönetimi
- Gerekli import'ları ekle
- Kullanılmayan import'ları kaldır
- Package.json güncellemesi gerekiyorsa yap

---

## 3. Doğrulama

### 3.1 Lint ve Format Kontrolü
```bash
// turbo
npm run lint
```

### 3.2 TypeScript Tip Kontrolü
```bash
// turbo
npx tsc --noEmit
```

### 3.3 Build Testi
```bash
npm run build
```

### 3.4 Dev Server Testi
```bash
npm run dev
```

---

## 4. Test

### 4.1 Unit Test (varsa)
```bash
// turbo
npm run test
```

### 4.2 Manuel Test
- Tarayıcıda değişiklikleri kontrol et
- Edge case'leri test et
- Responsive tasarımı doğrula

---

## 5. Dökümantasyon

### 5.1 Kod İçi Yorumlar
- Karmaşık logic'i açıkla
- TODO notları ekle (gerekirse)
- JSDoc yorumları kullan

### 5.2 README Güncellemesi
- Yeni özellikler için README'yi güncelle
- Kurulum veya yapılandırma değişikliklerini belgele

---

## 6. Son Kontroller

- [ ] Tüm değişiklikler test edildi
- [ ] Kod review'a hazır
- [ ] Kullanılmayan kod temizlendi
- [ ] Console.log'lar kaldırıldı
- [ ] Error handling eklendi

---

## Hızlı Referans Komutları

| İşlem | Komut |
|-------|-------|
| Dev server başlat | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test | `npm run test` |
| Tip kontrolü | `npx tsc --noEmit` |

---

## Notlar

> [!TIP]
> Her zaman mevcut kodu okumadan önce değişiklik yapma. Pattern'leri anla ve tutarlı ol.

> [!IMPORTANT]
> Build hatalarını düzeltmeden devam etme. Her adımda kodu çalışır durumda tut.

> [!WARNING]
> Büyük değişiklikler yaparken her zaman yedek al veya git commit yap.

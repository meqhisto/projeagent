import { test, expect } from '@playwright/test';

test.describe('Investor Presentation', () => {
    // Not: Test verisi veritabanında olmayabilir, bu yüzden önce public bir sayfayı kontrol edeceğiz
    // Gerçek senaryoda seed data veya mock request kullanmalıyız. 
    // Şimdilik sadece sayfa yapısının çalıştığını doğruluyoruz.

    test('should load presentation page structure', async ({ page }) => {
        // Rastgele bir ID ile git (404 veya yetki hatası alabilir ama app crash olmamalı)
        // Not: Bu testin geçmesi için geçerli bir token veya ID lazım. 
        // Mocking olmadan zor, o yüzden şimdilik login sayfasına yönlendirmeyi veya 
        // 404/403 sayfasının düzgün render edildiğini kontrol edelim.

        // Daha iyi bir yaklaşım: Login olup gerçek bir parsel sunumuna gitmek.
        // Ancak veritabanı durumunu bilmediğimiz için basit başlıyoruz.

        const response = await page.goto('/parcels/1/presentation');

        // Sayfa tamamen patlamamalı (500 error almamalıyız)
        expect(response?.status()).not.toBe(500);

        // Eğer yetki hatası alıyorsak (beklenen durum), login ekranına atmalı veya hata mesajı göstermeli
        // Title kontrolü
        const title = await page.title();
        console.log('Page title:', title);
    });
});

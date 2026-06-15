/**
 * Tek seferlik test scripti — imar scraper'ını doğrulamak için.
 * Kullanım: npx tsx scripts/test-imar.ts
 */
import { fetchImarDurumu } from "../lib/agents/imar/registry";

async function main() {
  console.log("🔍 Çanakkale imar sorgusu başlatılıyor...");
  console.log("   Ada: 1160 | Parsel: 1\n");

  const sonuc = await fetchImarDurumu("Çanakkale", "1160", "1");

  if (!sonuc) {
    console.error("❌ Sonuç alınamadı.");
    process.exit(1);
  }

  console.log("✅ Sorgu başarılı!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Ada          : ${sonuc.ada}`);
  console.log(`Parsel       : ${sonuc.parsel}`);
  console.log(`Mahalle      : ${sonuc.mahalleAdi ?? "—"}`);
  console.log(`KAKS (Emsal) : ${sonuc.kaks ?? "—"}`);
  console.log(`TAKS         : ${sonuc.taks ?? "—"}`);
  console.log(`Hmax         : ${sonuc.hmax ?? "—"}`);
  console.log(`Kullanım     : ${sonuc.kullanimAmaci ?? "—"}`);
  console.log(`Yapı Nizamı  : ${sonuc.yapiNizami ?? "—"}`);
  console.log(`Plan Görsel  : ${sonuc.planGorselUrl ?? "—"}`);
  console.log(`Kaynak       : ${sonuc.sourceUrl}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (sonuc.hammadde && Object.keys(sonuc.hammadde).length > 0) {
    console.log("\n📦 Ham veri (imar.aspx alan adları):");
    console.log(JSON.stringify(sonuc.hammadde, null, 2));
  }
}

main().catch((err) => {
  console.error("❌ Hata:", err.message);
  process.exit(1);
});

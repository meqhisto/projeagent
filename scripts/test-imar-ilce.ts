import { fetchImarDurumu } from "../lib/agents/imar/registry";

async function testIlce(sehir: string, ada: string, parsel: string) {
  process.stdout.write(`\n🔍 ${sehir} Ada:${ada}/P:${parsel} → `);
  const s = await fetchImarDurumu(sehir, ada, parsel);
  if (!s) { console.log("✗ Kayıt yok"); return; }
  console.log(`✅  Mahalle:${s.mahalleAdi ?? "—"} KAKS:${s.kaks ?? "—"} Hmax:${s.hmax ?? "—"} Kullanım:${s.kullanimAmaci ?? "—"}`);
  console.log(`    Kaynak: ${s.sourceUrl}`);
}

async function main() {
  await testIlce("Çanakkale", "1160", "1");
  await testIlce("Gelibolu", "150", "1");
  await testIlce("Biga", "150", "2");
}

main().catch(e => { console.error("Hata:", e.message); process.exit(1); });

import { fetchVisualData } from "@/lib/agents/visual_fetcher";
import { researchZoningInfo } from "@/lib/agents/zoning_researcher";
import { fetchImarDurumu } from "@/lib/agents/imar/registry";
import { prisma } from "@/lib/prisma";

export async function processParcelInBackground(parcelId: number) {
    console.log(`Starting background processing for Parcel ID: ${parcelId}`);

    try {
        const parcel = await prisma.parcel.findUnique({ where: { id: parcelId } });
        if (!parcel) return;

        // 1. Fetch Visual Data
        console.log("Fetching visual data...");
        const visualData = await fetchVisualData(parcel.city, parcel.district, parcel.island, parcel.parsel);

        if (visualData && visualData.imageUrl) {
            await prisma.image.create({
                data: {
                    parcelId: parcel.id,
                    url: visualData.imageUrl,
                    type: "MAP_SCREENSHOT",
                    source: "AUTO",
                }
            });
        }

        // 2. Belediye WebGIS'ten imar durumu çek (desteklenen şehirler için)
        console.log("Belediye WebGIS'ten imar durumu sorgulanıyor...");
        const imarData = await fetchImarDurumu(parcel.city, parcel.island, parcel.parsel);

        if (imarData) {
            console.log(`[process_parcel] İmar verisi alındı: ${parcel.city} - ${parcel.island}/${parcel.parsel}`);

            // Plan görsel URL'ini kaydet (Image.type = "IMAR_PLAN")
            // Image modelinde (parcelId, type) üzerinde unique constraint olmadığından
            // önce var mı kontrol et, varsa güncelle yoksa oluştur.
            if (imarData.planGorselUrl) {
                const mevcutGorsel = await prisma.image.findFirst({
                    where: { parcelId: parcel.id, type: "IMAR_PLAN" }
                });
                if (mevcutGorsel) {
                    await prisma.image.update({
                        where: { id: mevcutGorsel.id },
                        data: { url: imarData.planGorselUrl }
                    });
                } else {
                    await prisma.image.create({
                        data: { parcelId: parcel.id, url: imarData.planGorselUrl, type: "IMAR_PLAN", source: "AUTO" }
                    });
                }
            }

            // ZoningInfo alanlarını şema ile eşleştir:
            //   ks          → KAKS / Emsal
            //   taks        → TAKS
            //   maxHeight   → Hmax / Bina Yüksekliği  (schema field adı)
            //   zoningType  → Kullanım amacı / Fonksiyon
            //   notes       → Yapı nizamı + ek notlar
            const notSatirlari = [
                imarData.mahalleAdi ? `Mahalle: ${imarData.mahalleAdi}` : null,
                imarData.yapiNizami ? `Yapı Nizamı: ${imarData.yapiNizami}` : null,
                imarData.notlar ? `Not: ${imarData.notlar}` : null,
            ].filter(Boolean).join("\n") || null;

            const existingZoning = await prisma.zoningInfo.findUnique({ where: { parcelId: parcel.id } });

            if (existingZoning) {
                await prisma.zoningInfo.update({
                    where: { parcelId: parcel.id },
                    data: {
                        ks:         imarData.kaks      ?? existingZoning.ks,
                        taks:       imarData.taks      ?? existingZoning.taks,
                        maxHeight:  imarData.hmax      ?? existingZoning.maxHeight,
                        zoningType: imarData.kullanimAmaci ?? existingZoning.zoningType,
                        notes:      notSatirlari       ?? existingZoning.notes,
                        sourceUrl:  imarData.sourceUrl,
                    }
                });
            } else {
                await prisma.zoningInfo.create({
                    data: {
                        parcelId:   parcel.id,
                        ks:         imarData.kaks          ?? null,
                        taks:       imarData.taks          ?? null,
                        maxHeight:  imarData.hmax          ?? null,
                        zoningType: imarData.kullanimAmaci ?? null,
                        notes:      notSatirlari,
                        sourceUrl:  imarData.sourceUrl,
                    }
                });
            }

        } else {
            // 3. Desteklenmeyen şehir — Google araması ile dene (fallback)
            console.log("Belediye servisi yok, Google araması deneniyor...");
            const zoningData = await researchZoningInfo(parcel.city, parcel.district, parcel.island, parcel.parsel);

            if (zoningData) {
                const existingZoning = await prisma.zoningInfo.findUnique({ where: { parcelId: parcel.id } });
                if (!existingZoning) {
                    await prisma.zoningInfo.create({
                        data: {
                            parcelId:  parcel.id,
                            ks:        zoningData.ks,
                            taks:      zoningData.taks,
                            notes:     zoningData.notes,
                            sourceUrl: zoningData.sourceUrl,
                        }
                    });
                }
            }
        }

        // 4. Durumu tamamlandı olarak işaretle
        await prisma.parcel.update({
            where: { id: parcel.id },
            data: { status: "COMPLETED" }
        });

        console.log(`Completed processing for Parcel ID: ${parcelId}`);

    } catch (error) {
        console.error(`Error processing parcel ${parcelId}:`, error);
    }
}

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
                    type: "MAP_SCREENSHOT"
                }
            });
        }

        // 2. Belediye WebGIS'ten imar durumu çek (desteklenen şehirler için)
        console.log("Belediye WebGIS'ten imar durumu sorgulanıyor...");
        const imarData = await fetchImarDurumu(parcel.city, parcel.island, parcel.parsel);

        if (imarData) {
            console.log(`[process_parcel] İmar verisi alındı: ${parcel.city} - ${parcel.island}/${parcel.parsel}`);
            const existingZoning = await prisma.zoningInfo.findUnique({ where: { parcelId: parcel.id } });

            if (existingZoning) {
                await prisma.zoningInfo.update({
                    where: { parcelId: parcel.id },
                    data: {
                        ks: imarData.kaks ?? existingZoning.ks,
                        taks: imarData.taks ?? existingZoning.taks,
                        notes: [
                            imarData.mahalleAdi ? `Mahalle: ${imarData.mahalleAdi}` : null,
                            imarData.kullanimAmaci ? `Kullanım: ${imarData.kullanimAmaci}` : null,
                            imarData.yapiNizami ? `Yapı Nizamı: ${imarData.yapiNizami}` : null,
                        ].filter(Boolean).join("\n") || existingZoning.notes,
                        sourceUrl: imarData.sourceUrl,
                    }
                });
            } else {
                await prisma.zoningInfo.create({
                    data: {
                        parcelId: parcel.id,
                        ks: imarData.kaks ?? null,
                        taks: imarData.taks ?? null,
                        notes: [
                            imarData.mahalleAdi ? `Mahalle: ${imarData.mahalleAdi}` : null,
                            imarData.kullanimAmaci ? `Kullanım: ${imarData.kullanimAmaci}` : null,
                            imarData.yapiNizami ? `Yapı Nizamı: ${imarData.yapiNizami}` : null,
                        ].filter(Boolean).join("\n") || null,
                        sourceUrl: imarData.sourceUrl,
                    }
                });
            }
        } else {
            // 3. Desteklenmeyen şehir — Google araması ile dene
            console.log("Belediye servisi yok, Google araması deneniyor...");
            const zoningData = await researchZoningInfo(parcel.city, parcel.district, parcel.island, parcel.parsel);

            if (zoningData) {
                const existingZoning = await prisma.zoningInfo.findUnique({ where: { parcelId: parcel.id } });
                if (!existingZoning) {
                    await prisma.zoningInfo.create({
                        data: {
                            parcelId: parcel.id,
                            ks: zoningData.ks,
                            taks: zoningData.taks,
                            notes: zoningData.notes,
                            sourceUrl: zoningData.sourceUrl
                        }
                    });
                }
            }
        }

        // 4. Update Status
        await prisma.parcel.update({
            where: { id: parcel.id },
            data: { status: "COMPLETED" }
        });

        console.log(`Completed processing for Parcel ID: ${parcelId}`);

    } catch (error) {
        console.error(`Error processing parcel ${parcelId}:`, error);
    }
}

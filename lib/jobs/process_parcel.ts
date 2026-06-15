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

            // Save imar plan image if URL was found in the detail page
            if (imarData.planGorselUrl) {
                await prisma.image.upsert({
                    where: { parcelId_type: { parcelId: parcel.id, type: "IMAR_PLAN" } } as never,
                    create: { parcelId: parcel.id, url: imarData.planGorselUrl, type: "IMAR_PLAN", source: "AUTO" },
                    update: { url: imarData.planGorselUrl },
                }).catch(() => {
                    // upsert may fail if unique constraint doesn't exist — fall back to create
                    prisma.image.create({
                        data: { parcelId: parcel.id, url: imarData.planGorselUrl!, type: "IMAR_PLAN", source: "AUTO" }
                    }).catch(console.warn);
                });
            }

            const existingZoning = await prisma.zoningInfo.findUnique({ where: { parcelId: parcel.id } });

            const notesLines = [
                imarData.mahalleAdi ? `Mahalle: ${imarData.mahalleAdi}` : null,
                imarData.yapiNizami ? `Yapı Nizamı: ${imarData.yapiNizami}` : null,
                imarData.notlar ? `Not: ${imarData.notlar}` : null,
            ].filter(Boolean).join("\n") || null;

            if (existingZoning) {
                await prisma.zoningInfo.update({
                    where: { parcelId: parcel.id },
                    data: {
                        ks: imarData.kaks ?? existingZoning.ks,
                        taks: imarData.taks ?? existingZoning.taks,
                        maxHeight: imarData.hmax ?? existingZoning.maxHeight,
                        zoningType: imarData.kullanimAmaci ?? existingZoning.zoningType,
                        notes: notesLines ?? existingZoning.notes,
                        sourceUrl: imarData.sourceUrl,
                    }
                });
            } else {
                await prisma.zoningInfo.create({
                    data: {
                        parcelId: parcel.id,
                        ks: imarData.kaks ?? null,
                        taks: imarData.taks ?? null,
                        maxHeight: imarData.hmax ?? null,
                        zoningType: imarData.kullanimAmaci ?? null,
                        notes: notesLines,
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

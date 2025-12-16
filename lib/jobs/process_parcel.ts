import { fetchVisualData } from "@/lib/agents/visual_fetcher";
import { researchZoningInfo } from "@/lib/agents/zoning_researcher";
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
                    url: visualData.imageUrl, // In a real app, upload this to S3/Cloudinary. Here we use base64 data URI temporarily or assuming local blob support if small enough.
                    type: "MAP_SCREENSHOT"
                }
            });
        }

        // 2. Research Zoning (Emsal)
        console.log("Researching zoning info...");
        const zoningData = await researchZoningInfo(parcel.city, parcel.district, parcel.island, parcel.parsel);

        if (zoningData) {
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

        // 3. Update Status
        await prisma.parcel.update({
            where: { id: parcel.id },
            data: { status: "COMPLETED" }
        });

        console.log(`Completed processing for Parcel ID: ${parcelId}`);

    } catch (error) {
        console.error(`Error processing parcel ${parcelId}:`, error);
        // Optionally update status to FAILED
    }
}

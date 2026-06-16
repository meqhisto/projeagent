import { prisma } from "@/lib/prisma";

// Eşleştirme puan ağırlıkları (toplam 100)
const WEIGHTS = {
    location: 40,
    area: 20,
    price: 20,
    extras: 20,
} as const;

interface DemandCriteria {
    city?: string | null;
    district?: string | null;
    neighborhood?: string | null;
    minArea?: number | null;
    maxArea?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    // Arsa
    parcelCategory?: string | null;
    minKAKS?: number | null;
    maxKAKS?: number | null;
    zoningType?: string | null;
    // Gayrimenkul
    propertyType?: string | null;
    roomType?: string | null;
    hasElevator?: boolean | null;
    hasParking?: boolean | null;
}

function scoreLocation(demand: DemandCriteria, city?: string, district?: string, neighborhood?: string): number {
    if (!demand.city) return WEIGHTS.location; // Konum kriteri yok → tam puan
    if (demand.city.toLowerCase() !== (city || "").toLowerCase()) return 0;
    if (!demand.district) return WEIGHTS.location;
    if (demand.district.toLowerCase() !== (district || "").toLowerCase()) return Math.round(WEIGHTS.location * 0.5);
    if (!demand.neighborhood) return WEIGHTS.location;
    if (demand.neighborhood.toLowerCase() !== (neighborhood || "").toLowerCase()) return Math.round(WEIGHTS.location * 0.85);
    return WEIGHTS.location;
}

function scoreRange(min: number | null | undefined, max: number | null | undefined, value: number | null | undefined, weight: number): number {
    if (min == null && max == null) return weight; // Kriter yok → tam puan
    if (value == null) return Math.round(weight * 0.3); // Değer bilinmiyor → kısmi puan
    if (min != null && value < min) return 0;
    if (max != null && value > max) return 0;
    return weight;
}

function scoreParcelExtras(demand: DemandCriteria, parcel: { category: string; zoning?: { ks?: number | null; zoningType?: string | null } | null }): number {
    let score = 0;
    let checks = 0;

    if (demand.parcelCategory) {
        checks++;
        if (parcel.category === demand.parcelCategory) score++;
    }
    if (demand.zoningType && parcel.zoning) {
        checks++;
        if ((parcel.zoning.zoningType || "").toLowerCase().includes(demand.zoningType.toLowerCase())) score++;
    }
    if ((demand.minKAKS != null || demand.maxKAKS != null) && parcel.zoning?.ks != null) {
        checks++;
        const ks = parcel.zoning.ks;
        const okMin = demand.minKAKS == null || ks >= demand.minKAKS;
        const okMax = demand.maxKAKS == null || ks <= demand.maxKAKS;
        if (okMin && okMax) score++;
    }

    if (checks === 0) return WEIGHTS.extras;
    return Math.round((score / checks) * WEIGHTS.extras);
}

function scorePropertyExtras(demand: DemandCriteria, prop: { type: string; roomType?: string | null; hasElevator: boolean; hasParking: boolean }): number {
    let score = 0;
    let checks = 0;

    if (demand.propertyType) {
        checks++;
        if (prop.type === demand.propertyType) score++;
    }
    if (demand.roomType) {
        checks++;
        if (prop.roomType === demand.roomType) score++;
    }
    if (demand.hasElevator != null) {
        checks++;
        if (prop.hasElevator === demand.hasElevator) score++;
    }
    if (demand.hasParking != null) {
        checks++;
        if (prop.hasParking === demand.hasParking) score++;
    }

    if (checks === 0) return WEIGHTS.extras;
    return Math.round((score / checks) * WEIGHTS.extras);
}

export async function runMatchForDemand(demandId: number): Promise<number> {
    const demand = await prisma.demandRequest.findUniqueOrThrow({
        where: { id: demandId },
    });

    const upserts: { demandId: number; parcelId?: number; propertyId?: number; score: number }[] = [];

    if (demand.type === "PARCEL" || demand.type === "BOTH") {
        const parcels = await prisma.parcel.findMany({
            include: { zoning: true },
        });

        for (const p of parcels) {
            const locScore = scoreLocation(demand, p.city, p.district, p.neighborhood);
            const areaScore = scoreRange(demand.minArea, demand.maxArea, p.area, WEIGHTS.area);
            const priceScore = scoreRange(demand.minPrice, demand.maxPrice, p.askingPrice, WEIGHTS.price);
            const extrasScore = scoreParcelExtras(demand, { category: p.category, zoning: p.zoning });
            const total = locScore + areaScore + priceScore + extrasScore;

            if (total >= 20) {
                upserts.push({ demandId, parcelId: p.id, score: total });
            }
        }
    }

    if (demand.type === "PROPERTY" || demand.type === "BOTH") {
        const properties = await prisma.property.findMany({});

        for (const p of properties) {
            const locScore = scoreLocation(demand, p.city, p.district, p.neighborhood);
            const areaScore = scoreRange(demand.minArea, demand.maxArea, p.netArea ?? p.grossArea, WEIGHTS.area);
            const priceScore = scoreRange(demand.minPrice, demand.maxPrice, p.listingPrice ?? p.currentValue, WEIGHTS.price);
            const extrasScore = scorePropertyExtras(demand, {
                type: p.type,
                roomType: p.roomType,
                hasElevator: p.hasElevator,
                hasParking: p.hasParking,
            });
            const total = locScore + areaScore + priceScore + extrasScore;

            if (total >= 20) {
                upserts.push({ demandId, propertyId: p.id, score: total });
            }
        }
    }

    // Mevcut SUGGESTED eşleşmeleri sil, yenilerini yaz
    await prisma.demandMatch.deleteMany({
        where: { demandId, status: "SUGGESTED" },
    });

    if (upserts.length > 0) {
        await prisma.demandMatch.createMany({
            data: upserts.map(u => ({
                demandId: u.demandId,
                parcelId: u.parcelId ?? null,
                propertyId: u.propertyId ?? null,
                score: u.score,
                status: "SUGGESTED",
            })),
            skipDuplicates: true,
        });

        // Eşleşme varsa talebi MATCHED durumuna çek
        await prisma.demandRequest.update({
            where: { id: demandId },
            data: { status: "MATCHED" },
        });
    }

    return upserts.length;
}

// Yeni bir parsel/gayrimenkul eklendiğinde açık talepler üzerinde çalıştır
export async function runMatchForAllOpenDemands(): Promise<void> {
    const openDemands = await prisma.demandRequest.findMany({
        where: { status: { in: ["OPEN", "MATCHED"] } },
        select: { id: true },
    });

    for (const d of openDemands) {
        await runMatchForDemand(d.id).catch(() => null);
    }
}

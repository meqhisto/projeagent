import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

type ParcelCategory =
    | "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "AGRICULTURAL"
    | "MIXED_USE" | "TOURISM" | "INVESTMENT" | "DEVELOPMENT" | "UNCATEGORIZED";

export type ValuationMethod = "comparable_sales" | "zoning_based" | "hybrid";

export interface Adjustment {
    factor: string;
    multiplier: number;
    description: string;
}

export interface ComparableInfo {
    parcelId: number;
    title: string;
    pricePerM2: number;
    similarity: number;
    source: string;
}

export interface ValuationResult {
    estimatedPricePerM2: number;
    estimatedTotalValue: number;
    confidenceScore: number;
    comparableCount: number;
    method: ValuationMethod;
    adjustments: Adjustment[];
    comparables: ComparableInfo[];
    rangeMin: number;
    rangeMax: number;
}

interface SubjectParcel {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    area: number | null;
    category: ParcelCategory;
    latitude: number | null;
    longitude: number | null;
    askingPrice: number | null;
    zoning: { ks: number | null; taks: number | null; maxHeight: number | null } | null;
}

interface DataPoint {
    parcelId: number;
    title: string;
    pricePerM2: number;
    area: number | null;
    category: ParcelCategory;
    neighborhood: string;
    ks: number | null;
    lat: number | null;
    lon: number | null;
    source: string;
    sourceTier: "precedent" | "askingPrice";
    createdAt: Date;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NATIONAL_DEFAULT_PRICE_PER_M2: Record<ParcelCategory, number> = {
    RESIDENTIAL: 12000,
    COMMERCIAL: 25000,
    MIXED_USE: 18000,
    INDUSTRIAL: 5000,
    AGRICULTURAL: 800,
    TOURISM: 30000,
    INVESTMENT: 10000,
    DEVELOPMENT: 15000,
    UNCATEGORIZED: 8000,
};

// Similarity matrix for category pairs — symmetric
const CATEGORY_SIMILARITY: Partial<Record<string, number>> = {};

function catKey(a: ParcelCategory, b: ParcelCategory): string {
    return [a, b].sort().join("|");
}

// Related groups
const URBAN = ["RESIDENTIAL", "MIXED_USE", "DEVELOPMENT", "INVESTMENT"] as ParcelCategory[];
const COMMERCIAL_GROUP = ["COMMERCIAL", "MIXED_USE"] as ParcelCategory[];
const SPECIAL = ["INDUSTRIAL", "AGRICULTURAL"] as ParcelCategory[];

for (const a of Object.keys(NATIONAL_DEFAULT_PRICE_PER_M2) as ParcelCategory[]) {
    for (const b of Object.keys(NATIONAL_DEFAULT_PRICE_PER_M2) as ParcelCategory[]) {
        if (a === b) { CATEGORY_SIMILARITY[catKey(a, b)] = 1.0; continue; }
        const bothUrban = URBAN.includes(a) && URBAN.includes(b);
        const bothCommercial = COMMERCIAL_GROUP.includes(a) && COMMERCIAL_GROUP.includes(b);
        const eitherSpecial = SPECIAL.includes(a) !== SPECIAL.includes(b);
        if (bothUrban || bothCommercial) CATEGORY_SIMILARITY[catKey(a, b)] = 0.6;
        else if (eitherSpecial) CATEGORY_SIMILARITY[catKey(a, b)] = 0.1;
        else CATEGORY_SIMILARITY[catKey(a, b)] = 0.3;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

function stddev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
}

function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
}

function mode<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    const counts = new Map<T, number>();
    for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
    let best: T = arr[0], bestCount = 0;
    for (const [v, c] of counts) if (c > bestCount) { best = v; bestCount = c; }
    return best;
}

// ─── IQR filter ──────────────────────────────────────────────────────────────

function iqrFilter(points: DataPoint[]): DataPoint[] {
    if (points.length < 6) return points;
    const prices = points.map(p => p.pricePerM2).sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    return points.filter(p => p.pricePerM2 >= lo && p.pricePerM2 <= hi);
}

// ─── Validity filter ─────────────────────────────────────────────────────────

function validityFilter(points: DataPoint[]): DataPoint[] {
    return points.filter(p =>
        isFinite(p.pricePerM2) &&
        p.pricePerM2 >= 50 &&
        p.pricePerM2 <= 5_000_000 &&
        (p.area === null || (p.area >= 10 && p.area <= 1_000_000))
    );
}

// ─── Similarity scoring ───────────────────────────────────────────────────────

function scoreSimilarity(
    subject: SubjectParcel,
    dp: DataPoint,
    radiusKm: number
): number {
    // Category (30%)
    const sCat = CATEGORY_SIMILARITY[catKey(subject.category, dp.category)] ?? 0.3;

    // Area (20%)
    let sArea = 0.5; // neutral if either missing
    if (subject.area && dp.area) {
        const ratio = Math.min(subject.area, dp.area) / Math.max(subject.area, dp.area);
        sArea = Math.sqrt(ratio);
    }

    // KAKS/Emsal (20%)
    let sZone = 0.5;
    const subKs = subject.zoning?.ks;
    if (subKs != null && dp.ks != null) {
        sZone = Math.max(0, 1 - Math.abs(subKs - dp.ks) / 2.0);
    }

    // Location (30%)
    let sLoc: number;
    if (subject.neighborhood === dp.neighborhood) {
        sLoc = 1.0;
    } else if (subject.latitude && subject.longitude && dp.lat && dp.lon) {
        const dist = haversineKm(subject.latitude, subject.longitude, dp.lat, dp.lon);
        sLoc = Math.max(0, 1 - dist / radiusKm);
    } else {
        sLoc = 0.4;
    }

    return 0.30 * sCat + 0.20 * sArea + 0.20 * sZone + 0.30 * sLoc;
}

// ─── Data gathering ───────────────────────────────────────────────────────────

async function gatherDataPoints(
    subject: SubjectParcel,
    scope: { city: string; district?: string }
): Promise<DataPoint[]> {
    const districtFilter = scope.district ? { district: scope.district } : {};

    // Precedents from any parcel in scope, excluding subject's own
    const precedents = await prisma.parcelPrecedent.findMany({
        where: {
            parcelId: { not: subject.id },
            pricePerM2: { not: null, gt: 0 },
            parcel: { city: scope.city, ...districtFilter },
        },
        include: {
            parcel: {
                select: {
                    id: true, neighborhood: true, area: true, category: true,
                    latitude: true, longitude: true,
                    zoning: { select: { ks: true } },
                },
            },
        },
        take: 200,
    });

    // Sibling parcels with askingPrice in scope
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const askingParcels: any[] = await (prisma.parcel.findMany as any)({
        where: {
            id: { not: subject.id },
            city: scope.city,
            ...districtFilter,
            askingPrice: { not: null, gt: 0 },
            area: { not: null, gt: 0 },
        },
        select: {
            id: true, neighborhood: true, area: true, category: true,
            latitude: true, longitude: true, askingPrice: true,
            zoning: { select: { ks: true } },
            createdAt: true,
        },
        take: 200,
    });

    const points: DataPoint[] = [];

    for (const p of precedents) {
        if (!p.pricePerM2) continue;
        points.push({
            parcelId: p.parcel.id,
            title: p.title,
            pricePerM2: p.pricePerM2,
            area: p.area,
            category: p.parcel.category as ParcelCategory,
            neighborhood: p.parcel.neighborhood,
            ks: p.parcel.zoning?.ks ?? null,
            lat: p.parcel.latitude,
            lon: p.parcel.longitude,
            source: `precedent:${p.source ?? "manuel"}`,
            sourceTier: "precedent",
            createdAt: p.createdAt,
        });
    }

    for (const p of askingParcels) {
        if (!p.askingPrice || !p.area) continue;
        const pricePerM2 = p.askingPrice / p.area;
        points.push({
            parcelId: p.id,
            title: `Parsel #${p.id} ilan fiyatı`,
            pricePerM2,
            area: p.area,
            category: p.category as ParcelCategory,
            neighborhood: p.neighborhood,
            ks: p.zoning?.ks ?? null,
            lat: p.latitude,
            lon: p.longitude,
            source: "parcel:askingPrice",
            sourceTier: "askingPrice",
            createdAt: p.createdAt,
        });
    }

    return points;
}

// ─── Adjustments ─────────────────────────────────────────────────────────────

function applyAdjustments(
    basePricePerM2: number,
    subject: SubjectParcel,
    usedPoints: DataPoint[]
): { finalPrice: number; adjustments: Adjustment[] } {
    const adjustments: Adjustment[] = [];
    let price = basePricePerM2;

    const subKs = subject.zoning?.ks;
    if (subKs != null && usedPoints.length >= 3) {
        const compKs = usedPoints.filter(p => p.ks != null).map(p => p.ks!);
        if (compKs.length > 0) {
            const medKs = median(compKs);
            const delta = subKs - medKs;
            if (Math.abs(delta) >= 0.25) {
                const mul = clamp(1 + delta * 0.15, 0.7, 1.4);
                price *= mul;
                adjustments.push({
                    factor: "zoning_density",
                    multiplier: parseFloat(mul.toFixed(3)),
                    description: `KAKS ${subKs.toFixed(1)} vs bölge medyanı ${medKs.toFixed(1)}`,
                });
            }
        }
    }

    if (subject.area && usedPoints.length >= 3) {
        const compAreas = usedPoints.filter(p => p.area != null).map(p => p.area!);
        if (compAreas.length > 0) {
            const medArea = median(compAreas);
            if (medArea > 0) {
                const ratio = subject.area / medArea;
                let mul: number | null = null;
                if (ratio < 0.5) mul = 1.10;
                else if (ratio < 0.8) mul = 1.05;
                else if (ratio > 2.0) mul = 0.92;
                else if (ratio > 1.5) mul = 0.96;
                if (mul !== null) {
                    price *= mul;
                    adjustments.push({
                        factor: "area_tier",
                        multiplier: mul,
                        description: `Subject alan ${subject.area.toFixed(0)} m² vs medyan ${medArea.toFixed(0)} m²`,
                    });
                }
            }
        }
    }

    const PREMIUM: Partial<Record<ParcelCategory, number>> = {
        COMMERCIAL: 1.15, TOURISM: 1.20, MIXED_USE: 1.08,
    };
    const DISCOUNT: Partial<Record<ParcelCategory, number>> = {
        AGRICULTURAL: 0.85, INDUSTRIAL: 0.90,
    };
    const dominantCat = mode(usedPoints.map(p => p.category));
    if (dominantCat) {
        if (PREMIUM[subject.category] && !PREMIUM[dominantCat]) {
            const mul = PREMIUM[subject.category]!;
            price *= mul;
            adjustments.push({
                factor: "category_premium",
                multiplier: mul,
                description: `${subject.category} kategorisi premium`,
            });
        } else if (DISCOUNT[subject.category] && !DISCOUNT[dominantCat]) {
            const mul = DISCOUNT[subject.category]!;
            price *= mul;
            adjustments.push({
                factor: "category_discount",
                multiplier: mul,
                description: `${subject.category} kategorisi indirimi`,
            });
        }
    }

    // Data freshness
    if (usedPoints.length > 0) {
        const ages = usedPoints.map(
            p => (Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (median(ages) > 365) {
            price *= 0.95;
            adjustments.push({
                factor: "data_freshness",
                multiplier: 0.95,
                description: "Emsal verilerin medyan yaşı bir yılı geçiyor",
            });
        }
    }

    return { finalPrice: price, adjustments };
}

// ─── Confidence ───────────────────────────────────────────────────────────────

function computeConfidence(
    usedPoints: DataPoint[],
    similarities: number[],
    method: ValuationMethod
): number {
    if (method === "zoning_based") return 20;

    const sCount = Math.min(1, usedPoints.length / 10);
    const sQuality = similarities.length > 0
        ? similarities.reduce((s, v) => s + v, 0) / similarities.length
        : 0;
    const prices = usedPoints.map(p => p.pricePerM2);
    const mean = prices.length > 0
        ? prices.reduce((s, v) => s + v, 0) / prices.length
        : 1;
    const cv = mean > 0 ? stddev(prices) / mean : 1;
    const sSpread = Math.max(0, 1 - cv);

    return Math.round(100 * (0.4 * sCount + 0.4 * sQuality + 0.2 * sSpread));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function valueParcel(
    parcelId: number,
    opts: { radiusKm?: number } = {}
): Promise<ValuationResult> {
    const radiusKm = opts.radiusKm ?? 5;

    // Load subject parcel
    const raw = await prisma.parcel.findUnique({
        where: { id: parcelId },
        include: { zoning: { select: { ks: true, taks: true, maxHeight: true } } },
    });

    if (!raw) throw new Error("Parcel not found");

    const subject: SubjectParcel = {
        id: raw.id,
        city: raw.city,
        district: raw.district,
        neighborhood: raw.neighborhood,
        area: raw.area,
        category: raw.category as ParcelCategory,
        latitude: raw.latitude,
        longitude: raw.longitude,
        askingPrice: (raw as any).askingPrice ?? null,
        zoning: raw.zoning,
    };

    // Gather data — district first, then city-level fallback
    let allPoints = validityFilter(
        iqrFilter(await gatherDataPoints(subject, { city: subject.city, district: subject.district }))
    );
    let usedFallbackCity = false;

    if (allPoints.length < 3) {
        const cityPoints = validityFilter(
            iqrFilter(await gatherDataPoints(subject, { city: subject.city }))
        );
        if (cityPoints.length > allPoints.length) {
            allPoints = cityPoints;
            usedFallbackCity = true;
        }
    }

    // Score and filter
    const scored = allPoints
        .map(dp => ({
            dp,
            similarity: scoreSimilarity(subject, dp, radiusKm),
            effectiveWeight:
                scoreSimilarity(subject, dp, radiusKm) *
                (dp.sourceTier === "askingPrice" ? 0.7 : 1.0),
        }))
        .filter(s => s.similarity >= 0.20)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 15);

    const usedPoints = scored.map(s => s.dp);
    const similarities = scored.map(s => s.similarity);

    // Method
    const method: ValuationMethod =
        usedPoints.length >= 3
            ? "comparable_sales"
            : usedPoints.length >= 1 && subject.zoning?.ks != null
            ? "hybrid"
            : "zoning_based";

    const extraAdjustments: Adjustment[] = [];

    let basePricePerM2: number;

    if (method === "zoning_based") {
        basePricePerM2 = NATIONAL_DEFAULT_PRICE_PER_M2[subject.category];
        const ks = subject.zoning?.ks ?? 1.0;
        const zoningMul = clamp(0.8 + ks * 0.25, 0.6, 2.0);
        extraAdjustments.push({
            factor: "zoning_based_estimate",
            multiplier: parseFloat(zoningMul.toFixed(3)),
            description: `İmar bazlı tahmin — KAKS ${ks} üzerinden hesaplandı`,
        });
        basePricePerM2 *= zoningMul;
    } else {
        const totalWeight = scored.reduce((s, v) => s + v.effectiveWeight, 0);
        basePricePerM2 =
            totalWeight > 0
                ? scored.reduce((s, v) => s + v.dp.pricePerM2 * v.effectiveWeight, 0) / totalWeight
                : NATIONAL_DEFAULT_PRICE_PER_M2[subject.category];
    }

    if (usedFallbackCity) {
        extraAdjustments.push({
            factor: "fallback_city",
            multiplier: 0.95,
            description: "İlçe yeterli veri yok — şehir geneli kullanıldı",
        });
        basePricePerM2 *= 0.95;
    }

    const { finalPrice, adjustments } = applyAdjustments(basePricePerM2, subject, usedPoints);
    const allAdjustments = [...extraAdjustments, ...adjustments];

    let confidence = computeConfidence(usedPoints, similarities, method);
    if (usedFallbackCity) confidence = Math.round(confidence * 0.8);
    if (method === "zoning_based") confidence = Math.min(confidence, 20);

    const estimatedTotalValue = subject.area
        ? Math.round(finalPrice * subject.area)
        : 0;

    const comparables: ComparableInfo[] = scored.slice(0, 10).map(s => ({
        parcelId: s.dp.parcelId,
        title: s.dp.title,
        pricePerM2: Math.round(s.dp.pricePerM2),
        similarity: parseFloat((s.similarity * 100).toFixed(1)),
        source: s.dp.source,
    }));

    return {
        estimatedPricePerM2: Math.round(finalPrice),
        estimatedTotalValue,
        confidenceScore: clamp(confidence, 0, 100),
        comparableCount: usedPoints.length,
        method,
        adjustments: allAdjustments,
        comparables,
        rangeMin: Math.round(estimatedTotalValue * 0.85),
        rangeMax: Math.round(estimatedTotalValue * 1.15),
    };
}

// Core domain types for ParselMonitor
// These types mirror the Prisma schema but are used in the frontend

export type ParcelCategory =
    | "RESIDENTIAL"
    | "COMMERCIAL"
    | "INDUSTRIAL"
    | "AGRICULTURAL"
    | "MIXED_USE"
    | "TOURISM"
    | "INVESTMENT"
    | "DEVELOPMENT"
    | "UNCATEGORIZED";

export type ParcelStatus = "PENDING" | "RESEARCHING" | "COMPLETED";

export type CrmStage =
    | "NEW_LEAD"
    | "CONTACTED"
    | "ANALYSIS"
    | "OFFER_SENT"
    | "CONTRACT"
    | "LOST";

export interface Parcel {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    island: string;
    parsel: string;
    area: number | null;
    latitude: number | null;
    longitude: number | null;
    status: ParcelStatus;
    crmStage: CrmStage;
    category: ParcelCategory;
    tags: string | null;
    ownerId: number;
    assignedTo: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    // Relations (optional when fetching)
    images?: ParcelImage[];
    documents?: Document[];
    zoning?: ZoningInfo | null;
    notes?: Note[];
    interactions?: Interaction[];
    stakeholders?: Customer[];
    calculations?: FeasibilityCalculation[];
}

export interface ParcelImage {
    id: number;
    url: string;
    type: "MAP" | "SATELLITE" | "TKGM_PARCEL" | "TKGM_NEIGHBORHOOD" | "UPLOADED";
    source: "AUTO" | "USER" | null;
    isDefault: boolean;
    parcelId: number;
    createdAt: string | Date;
}

export interface ZoningInfo {
    id: number;
    parcelId: number;
    ks: number | null;       // KAKS (Emsal)
    taks: number | null;     // TAKS
    maxHeight: number | null; // Hmax
    zoningType: string | null;
    notes: string | null;
    sourceUrl: string | null;
    retrievedAt: string | Date;
}

export interface Note {
    id: number;
    content: string;
    parcelId: number;
    createdAt: string | Date;
}

export interface Document {
    id: number;
    name: string;
    url: string;
    type: string;
    parcelId: number;
    createdAt: string | Date;
}

export interface Customer {
    id: number;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    ownerId: number;
    createdAt: string | Date;
}

export interface Interaction {
    id: number;
    type: string;
    notes: string | null;
    customerId: number;
    parcelId: number | null;
    createdAt: string | Date;
}

export interface FeasibilityCalculation {
    id: number;
    parcelId: number;
    // Input parameters
    arsaM2: number;
    emsal: number;
    katKarsiligiOrani: number;
    ortalamaDaireBrutu: number;
    insaatMaliyeti: number;
    satisFiyati: number;
    bonusFactor?: number | null;
    katAdedi?: number | null;

    // Summary results
    toplamDaire: number;
    muteahhitDaire: number;
    arsaSahibiDaire: number;
    netKar: string;
    roi: string;
    durum: string;

    fullResult: FeasibilityResult; // This might be parsed JSON or string depending on where it's used, but in frontend it's usually parsed
    createdAt: string | Date;
}

export interface PresentationUserSettings {
    companyName: string | null;
    email: string | null;
    phone: string | null;
    logoUrl: string | null;
    address: string | null;
    website: string | null;
}

export interface FeasibilityResult {
    totalCost: number;
    totalRevenue: number;
    netProfit: number;
    profitMargin: number;
    roi: number;
    breakdownCosts?: Record<string, number>;
    breakdownRevenue?: Record<string, number>;
    [key: string]: unknown;
}

export interface RegionalData {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    type: string;
    ks: number | null;
    taks: number | null;
    maxHeight: number | null;
    notes: string | null;
    createdAt: string | Date;
}

export interface UserPrecedent {
    id: number;
    parcelId: number;
    title: string;
    price: number;
    area: number | null;
    pricePerM2: number | null;
    sourceUrl: string | null;
    source: string | null;
    notes: string | null;
    createdAt: string | Date;
}

// Presentation types
export interface PresentationData {
    parcel: Parcel;
    images: ParcelImage[];
    zoning: ZoningInfo | null;
    notes: Note[];
    feasibility: FeasibilityCalculation | null;
    regionalData: RegionalData[];
    userPrecedents: UserPrecedent[];
}

// Form and utility types
export interface ApiError {
    error: string;
    message?: string;
}

export type HandleChangeFunction<T> = (field: keyof T, value: T[keyof T]) => void;

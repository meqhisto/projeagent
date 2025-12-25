// TypeScript types for Real Estate Portfolio System

// Enums matching Prisma schema
export type PropertyType =
    | "APARTMENT"
    | "VILLA"
    | "DETACHED"
    | "OFFICE"
    | "SHOP"
    | "COMMERCIAL"
    | "LAND"
    | "BUILDING"
    | "WAREHOUSE";

export type PropertyStatus =
    | "AVAILABLE"
    | "RENTED"
    | "SOLD"
    | "UNDER_CONSTRUCTION"
    | "RENOVATION"
    | "RESERVED";

export type RoomType =
    | "STUDIO"
    | "ONE_PLUS_ZERO"
    | "ONE_PLUS_ONE"
    | "TWO_PLUS_ONE"
    | "THREE_PLUS_ONE"
    | "THREE_PLUS_TWO"
    | "FOUR_PLUS_ONE"
    | "FOUR_PLUS_TWO"
    | "FIVE_PLUS_ONE"
    | "FIVE_PLUS_TWO"
    | "SIX_PLUS"
    | "OTHER";

export type TransactionType =
    | "RENT_INCOME"
    | "EXPENSE"
    | "PURCHASE"
    | "SALE"
    | "DEPOSIT"
    | "MAINTENANCE"
    | "TAX"
    | "INSURANCE";

// Labels for UI display
export const PropertyTypeLabels: Record<PropertyType, string> = {
    APARTMENT: "Daire",
    VILLA: "Villa",
    DETACHED: "Müstakil Ev",
    OFFICE: "Ofis",
    SHOP: "Dükkan",
    COMMERCIAL: "Ticari Alan",
    LAND: "Arsa",
    BUILDING: "Bina",
    WAREHOUSE: "Depo",
};

export const PropertyStatusLabels: Record<PropertyStatus, string> = {
    AVAILABLE: "Boş/Satılık",
    RENTED: "Kirada",
    SOLD: "Satıldı",
    UNDER_CONSTRUCTION: "İnşaat Halinde",
    RENOVATION: "Tadilatta",
    RESERVED: "Rezerve",
};

export const RoomTypeLabels: Record<RoomType, string> = {
    STUDIO: "Stüdyo",
    ONE_PLUS_ZERO: "1+0",
    ONE_PLUS_ONE: "1+1",
    TWO_PLUS_ONE: "2+1",
    THREE_PLUS_ONE: "3+1",
    THREE_PLUS_TWO: "3+2",
    FOUR_PLUS_ONE: "4+1",
    FOUR_PLUS_TWO: "4+2",
    FIVE_PLUS_ONE: "5+1",
    FIVE_PLUS_TWO: "5+2",
    SIX_PLUS: "6+",
    OTHER: "Diğer",
};

export const TransactionTypeLabels: Record<TransactionType, string> = {
    RENT_INCOME: "Kira Geliri",
    EXPENSE: "Gider",
    PURCHASE: "Satın Alma",
    SALE: "Satış",
    DEPOSIT: "Depozito",
    MAINTENANCE: "Bakım/Onarım",
    TAX: "Vergi",
    INSURANCE: "Sigorta",
};

// Status colors for UI
export const PropertyStatusColors: Record<PropertyStatus, { bg: string; text: string }> = {
    AVAILABLE: { bg: "bg-green-500/10", text: "text-green-400" },
    RENTED: { bg: "bg-blue-500/10", text: "text-blue-400" },
    SOLD: { bg: "bg-purple-500/10", text: "text-purple-400" },
    UNDER_CONSTRUCTION: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
    RENOVATION: { bg: "bg-orange-500/10", text: "text-orange-400" },
    RESERVED: { bg: "bg-pink-500/10", text: "text-pink-400" },
};

// Interface definitions
export interface PropertyImage {
    id: number;
    propertyId: number;
    url: string;
    type: string;
    isDefault: boolean;
    createdAt: string;
}

export interface Property {
    id: number;
    title: string;
    type: PropertyType;
    status: PropertyStatus;
    city: string;
    district: string;
    neighborhood: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    grossArea?: number | null;
    netArea?: number | null;
    roomType?: RoomType | null;
    floorNumber?: number | null;
    totalFloors?: number | null;
    buildYear?: number | null;
    hasElevator: boolean;
    hasParking: boolean;
    heatingType?: string | null;
    purchasePrice?: number | null;
    purchaseDate?: string | null;
    currentValue?: number | null;
    monthlyRent?: number | null;
    listingPrice?: number | null;
    parcelId?: number | null;
    ownerId: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    images?: PropertyImage[];
    parcel?: {
        id: number;
        island: string;
        parsel: string;
        neighborhood: string;
    } | null;
    _count?: {
        units: number;
        transactions: number;
    };
}

export interface Unit {
    id: number;
    propertyId: number;
    unitNumber: string;
    roomType?: RoomType | null;
    area?: number | null;
    status: PropertyStatus;
    floorNumber?: number | null;
    monthlyRent?: number | null;
    currentValue?: number | null;
    tenantId?: number | null;
    tenant?: {
        id: number;
        name: string;
        phone?: string | null;
    } | null;
    leaseStart?: string | null;
    leaseEnd?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Transaction {
    id: number;
    propertyId?: number | null;
    unitId?: number | null;
    type: TransactionType;
    amount: number;
    date: string;
    description?: string | null;
    category?: string | null;
    isPaid: boolean;
    dueDate?: string | null;
    createdAt: string;
}

export interface Valuation {
    id: number;
    propertyId: number;
    value: number;
    source?: string | null;
    date: string;
    notes?: string | null;
    createdAt: string;
}

// Form input types
export interface PropertyFormData {
    title: string;
    type: PropertyType;
    status: PropertyStatus;
    city: string;
    district: string;
    neighborhood: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    grossArea?: number;
    netArea?: number;
    roomType?: RoomType;
    floorNumber?: number;
    totalFloors?: number;
    buildYear?: number;
    hasElevator?: boolean;
    hasParking?: boolean;
    heatingType?: string;
    purchasePrice?: number;
    purchaseDate?: string;
    currentValue?: number;
    monthlyRent?: number;
    listingPrice?: number;
    parcelId?: number;
    notes?: string;
}

// Portfolio statistics
export interface PortfolioStats {
    totalProperties: number;
    totalValue: number;
    rentedCount: number;
    availableCount: number;
    monthlyRentIncome: number;
    averageValue: number;
    occupancyRate: number;
}

// Unit form data
export interface UnitFormData {
    unitNumber: string;
    roomType?: RoomType;
    area?: number;
    status: PropertyStatus;
    floorNumber?: number;
    monthlyRent?: number;
    currentValue?: number;
    tenantId?: number;
    leaseStart?: string;
    leaseEnd?: string;
    notes?: string;
}


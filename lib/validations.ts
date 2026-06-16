import { z } from "zod";

// ParcelCategory enum values
export const PARCEL_CATEGORIES = [
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "AGRICULTURAL",
    "MIXED_USE",
    "TOURISM",
    "INVESTMENT",
    "DEVELOPMENT",
    "UNCATEGORIZED",
] as const;

/**
 * Parcel Validation Schemas
 */
export const ParcelCreateSchema = z.object({
    city: z.string().min(2, "İl en az 2 karakter olmalı").max(50, "İl en fazla 50 karakter olmalı"),
    district: z.string().min(2, "İlçe en az 2 karakter olmalı").max(50),
    neighborhood: z.string().min(2, "Mahalle en az 2 karakter olmalı").max(100),
    island: z.string().min(1, "Ada numarası gerekli").max(20),
    parsel: z.string().min(1, "Parsel numarası gerekli").max(20),
    area: z.union([z.string(), z.number(), z.null()]).optional().transform(val =>
        (val !== null && val !== undefined && val !== "") ? parseFloat(String(val)) : null
    ),
    latitude: z.union([z.string(), z.number(), z.null()]).optional().transform(val =>
        (val !== null && val !== undefined && val !== "") ? parseFloat(String(val)) : null
    ),
    longitude: z.union([z.string(), z.number(), z.null()]).optional().transform(val =>
        (val !== null && val !== undefined && val !== "") ? parseFloat(String(val)) : null
    ),
    category: z.enum(PARCEL_CATEGORIES).optional().default("UNCATEGORIZED"),
    tags: z.string().max(500, "Etiketler en fazla 500 karakter olabilir").optional().nullable(),
    geometry: z.string().optional().nullable(),
    askingPrice: z.union([z.string(), z.number()]).optional().nullable().transform(val => {
        if (val === null || val === undefined || val === "") return null;
        const n = parseFloat(String(val));
        return isNaN(n) ? null : n;
    }).refine(v => v === null || (v >= 0 && v <= 1e12), { message: "Geçerli bir fiyat girin (0 - 1 trilyon TL)" }),
});


export const ParcelUpdateSchema = ParcelCreateSchema.partial();

/**
 * Customer Validation Schemas
 */
export const CustomerCreateSchema = z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
    role: z.enum(["Land Owner", "Investor", "Agent", "Other"], {
        message: "Geçersiz rol: Land Owner, Investor, Agent veya Other olmalı",
    }),
    phone: z.string().optional().refine(
        (val) => !val || /^[+]?[\d\s-]{10,20}$/.test(val),
        { message: "Geçersiz telefon numarası" }
    ),
    email: z.string().email("Geçerli bir email adresi girin").optional().or(z.literal("")),
    notes: z.string().max(1000, "Notlar en fazla 1000 karakter olabilir").optional(),
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

/**
 * Task/Interaction Validation Schemas
 */
export const TaskCreateSchema = z.object({
    parcelId: z.number().int().positive("Geçerli bir parsel ID gerekli"),
    customerId: z.number().int().positive().optional().nullable(),
    type: z.enum(["CALL", "MEETING", "OFFER", "NOTE", "TASK"], {
        message: "Geçersiz tip",
    }),
    content: z.string().min(1, "İçerik gerekli").max(2000),
    dueDate: z.string().datetime().optional().nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
    assignedTo: z.number().int().positive().optional().nullable(),
    tags: z.string().max(200).optional(),
});

/**
 * Auth Validation Schemas
 */
export const LoginSchema = z.object({
    email: z.string().email("Geçerli bir email adresi girin"),
    password: z.string().min(1, "Şifre gerekli"),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
    newPassword: z.string()
        .min(8, "Yeni şifre en az 8 karakter olmalı")
        .regex(/[A-Z]/, "En az bir büyük harf içermeli")
        .regex(/[a-z]/, "En az bir küçük harf içermeli")
        .regex(/[0-9]/, "En az bir rakam içermeli"),
});

/**
 * CRM Stage Validation
 */
export const CrmStageSchema = z.enum([
    "NEW_LEAD",
    "CONTACTED",
    "ANALYSIS",
    "OFFER_SENT",
    "CONTRACT",
    "LOST",
]);

/**
 * Zoning Info Validation
 */
export const ZoningUpdateSchema = z.object({
    ks: z.number().min(0).max(10).optional().nullable(),
    taks: z.number().min(0).max(1).optional().nullable(),
    maxHeight: z.number().min(0).max(500).optional().nullable(),
    zoningType: z.string().max(50).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    sourceUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Valuation Query Schema
 */
export const ValuationQuerySchema = z.object({
    radiusKm: z.coerce.number().min(0.5).max(50).optional().default(5),
});

/**
 * Demand / Talep Validation Schemas
 */
const numericOptional = z.union([z.string(), z.number(), z.null()]).optional().transform(val =>
    (val !== null && val !== undefined && val !== "") ? parseFloat(String(val)) : null
);

export const DemandCreateSchema = z.object({
    title: z.string().min(2, "Başlık en az 2 karakter olmalı").max(200),
    type: z.enum(["PARCEL", "PROPERTY", "BOTH"]).optional().default("BOTH"),
    customerId: z.number().int().positive().optional().nullable(),

    // Konum
    city: z.string().max(50).optional().nullable(),
    district: z.string().max(50).optional().nullable(),
    neighborhood: z.string().max(100).optional().nullable(),

    // Ortak fiyat/alan kriterleri
    minPrice: numericOptional,
    maxPrice: numericOptional,
    minArea: numericOptional,
    maxArea: numericOptional,

    // Arsa kriterleri
    parcelCategory: z.string().max(50).optional().nullable(),
    minKAKS: numericOptional,
    maxKAKS: numericOptional,
    zoningType: z.string().max(50).optional().nullable(),

    // Gayrimenkul kriterleri
    propertyType: z.string().max(50).optional().nullable(),
    roomType: z.string().max(50).optional().nullable(),
    hasElevator: z.boolean().optional().nullable(),
    hasParking: z.boolean().optional().nullable(),

    notes: z.string().max(2000).optional().nullable(),
    deadline: z.string().datetime().optional().nullable(),
});

export const DemandUpdateSchema = DemandCreateSchema.partial().extend({
    status: z.enum(["OPEN", "MATCHED", "CLOSED", "CANCELLED"]).optional(),
});

/**
 * Utility function to validate and return formatted errors
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: string[];
} {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map((issue: z.ZodIssue) =>
        `${issue.path.join(".")}: ${issue.message}`
    );

    return { success: false, errors };
}

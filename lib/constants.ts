/**
 * Application-wide constants
 * Eliminates magic strings throughout the codebase
 */

// User roles
export const ROLES = {
    ADMIN: "ADMIN",
    USER: "USER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Parcel statuses
export const PARCEL_STATUS = {
    PENDING: "PENDING",
    RESEARCHING: "RESEARCHING",
    COMPLETED: "COMPLETED",
} as const;

export type ParcelStatus = typeof PARCEL_STATUS[keyof typeof PARCEL_STATUS];

// CRM stages
export const CRM_STAGE = {
    NEW_LEAD: "NEW_LEAD",
    CONTACTED: "CONTACTED",
    ANALYSIS: "ANALYSIS",
    OFFER_SENT: "OFFER_SENT",
    CONTRACT: "CONTRACT",
    LOST: "LOST",
} as const;

export type CRMStage = typeof CRM_STAGE[keyof typeof CRM_STAGE];

// Interaction types
export const INTERACTION_TYPE = {
    TASK: "TASK",
    CALL: "CALL",
    MEETING: "MEETING",
    EMAIL: "EMAIL",
    NOTE: "NOTE",
} as const;

export type InteractionType = typeof INTERACTION_TYPE[keyof typeof INTERACTION_TYPE];

// Priority levels
export const PRIORITY = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT",
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

// Customer roles
export const CUSTOMER_ROLE = {
    LAND_OWNER: "Land Owner",
    INVESTOR: "Investor",
    AGENT: "Agent",
    OTHER: "Other",
} as const;

// Notification types
export const NOTIFICATION_TYPE = {
    TASK_ASSIGNED: "TASK_ASSIGNED",
    PARCEL_ADDED: "PARCEL_ADDED",
    RESEARCH_COMPLETED: "RESEARCH_COMPLETED",
    STAGE_CHANGED: "STAGE_CHANGED",
} as const;

// Image types
export const IMAGE_TYPE = {
    MAP: "MAP",
    SATELLITE: "SATELLITE",
    TKGM_PARCEL: "TKGM_PARCEL",
    TKGM_NEIGHBORHOOD: "TKGM_NEIGHBORHOOD",
    UPLOADED: "UPLOADED",
} as const;

// Image sources
export const IMAGE_SOURCE = {
    AUTO: "AUTO",
    USER: "USER",
} as const;

// Rate limit settings (reusable defaults)
export const RATE_LIMIT = {
    DEFAULT_MAX_REQUESTS: 100,
    DEFAULT_WINDOW_MS: 60 * 1000, // 1 minute
    AUTH_MAX_REQUESTS: 5,
    AUTH_WINDOW_MS: 60 * 1000,
} as const;

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const;

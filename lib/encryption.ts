/**
 * AES-256-GCM Encryption Utility
 * Provides secure field-level encryption for sensitive data
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 16;

/**
 * Get encryption key from environment or generate one
 * Key must be 32 bytes (256 bits)
 */
function getEncryptionKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;

    if (!keyHex) {
        throw new Error(
            "ENCRYPTION_KEY environment variable is not set. " +
            "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }

    const key = Buffer.from(keyHex, "hex");

    if (key.length !== 32) {
        throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
    }

    return key;
}

/**
 * Encrypt a plaintext string
 * Returns: base64 encoded string containing IV + AuthTag + Ciphertext
 */
export function encryptField(plaintext: string): string {
    if (!plaintext) return "";

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        // Combine IV + AuthTag + Encrypted data
        const combined = Buffer.concat([
            iv,
            authTag,
            Buffer.from(encrypted, "hex")
        ]);

        return combined.toString("base64");
    } catch (error) {
        console.error("[Encryption] Failed to encrypt:", error);
        throw new Error("Encryption failed");
    }
}

/**
 * Decrypt an encrypted string
 * Input: base64 encoded string containing IV + AuthTag + Ciphertext
 */
export function decryptField(encryptedData: string): string {
    if (!encryptedData) return "";

    try {
        const key = getEncryptionKey();
        const combined = Buffer.from(encryptedData, "base64");

        // Extract components
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("[Decryption] Failed to decrypt:", error);
        // Return original data if decryption fails (backward compatibility)
        // This allows reading unencrypted legacy data
        return encryptedData;
    }
}

/**
 * Check if a string is encrypted (base64 with proper structure)
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;

    try {
        const combined = Buffer.from(value, "base64");
        // Minimum size: IV + AuthTag + at least 1 byte of data
        return combined.length > IV_LENGTH + AUTH_TAG_LENGTH;
    } catch {
        return false;
    }
}

/**
 * Hash a value for comparison (e.g., for searching encrypted fields)
 * Uses HMAC-SHA256 with the encryption key
 */
export function hashForSearch(value: string): string {
    if (!value) return "";

    const key = getEncryptionKey();
    return crypto
        .createHmac("sha256", key)
        .update(value.toLowerCase().trim())
        .digest("hex");
}

/**
 * Encrypt sensitive customer fields
 */
export function encryptCustomerFields(customer: {
    phone?: string | null;
    email?: string | null;
}): { phone?: string | null; email?: string | null } {
    return {
        phone: customer.phone ? encryptField(customer.phone) : customer.phone,
        email: customer.email ? encryptField(customer.email) : customer.email,
    };
}

/**
 * Decrypt sensitive customer fields
 */
export function decryptCustomerFields<T extends { phone?: string | null; email?: string | null }>(
    customer: T
): T {
    return {
        ...customer,
        phone: customer.phone ? decryptField(customer.phone) : customer.phone,
        email: customer.email ? decryptField(customer.email) : customer.email,
    };
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString("hex");
}

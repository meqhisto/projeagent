/**
 * Centralized logging utility for ParselMonitor
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = {
    error(message: string, meta?: any) {
        if (['error', 'warn', 'info', 'debug'].includes(LOG_LEVEL)) {
            console.error(`[ERROR] ${message}`, meta || "");
        }
    },

    warn(message: string, meta?: any) {
        if (['warn', 'info', 'debug'].includes(LOG_LEVEL)) {
            console.warn(`[WARN] ${message}`, meta || "");
        }
    },

    info(message: string, meta?: any) {
        if (['info', 'debug'].includes(LOG_LEVEL)) {
            console.info(`[INFO] ${message}`, meta || "");
        }
    },

    debug(message: string, meta?: any) {
        if (process.env.NODE_ENV === 'development' || LOG_LEVEL === 'debug') {
            console.log(`[DEBUG] ${message}`, meta || "");
        }
    }
};

"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

// Toast Types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).slice(2);
        const duration = toast.duration ?? 4000;

        setToasts((prev) => [...prev, { ...toast, id }]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: "success", title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: "error", title, message, duration: 6000 });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: "warning", title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: "info", title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Toast Container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Toast Item
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const config = {
        success: {
            icon: CheckCircle,
            bg: "bg-[#34c759]",
            iconBg: "bg-white/20",
        },
        error: {
            icon: AlertCircle,
            bg: "bg-[#ff3b30]",
            iconBg: "bg-white/20",
        },
        warning: {
            icon: AlertTriangle,
            bg: "bg-[#ff9500]",
            iconBg: "bg-white/20",
        },
        info: {
            icon: Info,
            bg: "bg-[#0071e3]",
            iconBg: "bg-white/20",
        },
    };

    const { icon: Icon, bg, iconBg } = config[toast.type];

    return (
        <div
            className={clsx(
                "pointer-events-auto flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-xl shadow-lg text-white animate-slide-in-right",
                bg
            )}
        >
            <div className={clsx("p-1.5 rounded-lg shrink-0", iconBg)}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm opacity-90 mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

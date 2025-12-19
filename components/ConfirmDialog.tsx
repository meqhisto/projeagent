"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Onayla",
    cancelText = "İptal",
    variant = "danger",
    isLoading = false,
}: ConfirmDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={clsx(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Dialog */}
            <div className={clsx(
                "relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--card)] p-6 text-left shadow-2xl transition-all duration-300 border border-[var(--border)]",
                isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            )}>
                <div className="flex items-start gap-4">
                    <div className={clsx(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                        variant === "danger" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                            variant === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-semibold leading-6 text-slate-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-500 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={clsx(
                            "flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                            variant === "danger" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" :
                                variant === "warning" ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500" :
                                    "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                İşleniyor...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

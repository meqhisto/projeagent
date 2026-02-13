"use client";

import { AlertTriangle, X, Loader2 } from "lucide-react";
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
            // Use requestAnimationFrame to avoid synchronous state update in effect
            // which can cause cascading renders warning
            const frame = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(frame);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const variantConfig = {
        danger: {
            iconBg: "bg-[#ff3b30]/10",
            iconColor: "text-[#ff3b30]",
            buttonBg: "bg-[#ff3b30] hover:bg-[#d70015]",
        },
        warning: {
            iconBg: "bg-[#ff9500]/10",
            iconColor: "text-[#ff9500]",
            buttonBg: "bg-[#ff9500] hover:bg-[#c93400]",
        },
        info: {
            iconBg: "bg-[#0071e3]/10",
            iconColor: "text-[#0071e3]",
            buttonBg: "bg-[#0071e3] hover:bg-[#0077ed]",
        },
    };

    const config = variantConfig[variant];

    return (
        <div className={clsx(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Dialog */}
            <div className={clsx(
                "relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 border border-black/[0.04]",
                isOpen ? "scale-100" : "scale-95"
            )}>
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={clsx(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                        config.iconBg
                    )}>
                        <AlertTriangle className={clsx("h-5 w-5", config.iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">
                            {title}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#6e6e73] leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2.5 text-sm font-medium text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={clsx(
                            "flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            config.buttonBg
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

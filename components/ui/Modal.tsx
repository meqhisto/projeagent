"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import clsx from "clsx";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl"
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop - Apple style with subtle blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

            {/* Modal - Clean Apple card */}
            <div
                className={clsx(
                    "relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in",
                    "border border-black/[0.04]",
                    maxWidthClasses[maxWidth]
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
                    <h3 className="font-display text-[17px] font-semibold text-[#1d1d1f]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-[#86868b] hover:bg-black/[0.04] hover:text-[#1d1d1f] rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

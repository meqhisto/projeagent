"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className={clsx("flex flex-col items-center justify-center gap-3", className)}>
            <Loader2 className={clsx("animate-spin text-[#0071e3]", sizeClasses[size])} />
            {label && (
                <span className="text-sm text-[#6e6e73]">{label}</span>
            )}
        </div>
    );
}

interface PageLoaderProps {
    label?: string;
}

export function PageLoader({ label = "Yükleniyor..." }: PageLoaderProps) {
    return (
        <div className="flex min-h-[50vh] w-full items-center justify-center">
            <Spinner size="lg" label={label} />
        </div>
    );
}

interface FullPageLoaderProps {
    label?: string;
}

export function FullPageLoader({ label = "Yükleniyor..." }: FullPageLoaderProps) {
    return (
        <div className="fixed inset-0 bg-[#f5f5f7] flex items-center justify-center z-50">
            <Spinner size="lg" label={label} />
        </div>
    );
}

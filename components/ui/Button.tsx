"use client";

import clsx from "clsx";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, icon, children, disabled, ...props }, ref) => {
        const variantClasses = {
            primary: "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm",
            secondary: "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] border border-black/[0.04]",
            ghost: "text-[#1d1d1f] hover:bg-black/[0.04]",
            danger: "bg-[#ff3b30] text-white hover:bg-[#d70015]",
        };

        const sizeClasses = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4 py-2.5 text-sm",
            lg: "px-6 py-3 text-base",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
                    "transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : icon ? (
                    icon
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };

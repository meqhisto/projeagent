"use client";

import clsx from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, id, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-sm font-medium text-[#1d1d1f] mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]">
                            {icon}
                        </div>
                    )}
                    <input
                        id={id}
                        ref={ref}
                        className={clsx(
                            "w-full rounded-xl border bg-[#f5f5f7] px-4 py-3 text-[#1d1d1f] text-sm",
                            "placeholder:text-[#86868b]",
                            "border-transparent",
                            "focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "transition-all duration-200",
                            icon && "pl-11",
                            error && "border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[#ff3b30]/10",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-[#ff3b30]">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };

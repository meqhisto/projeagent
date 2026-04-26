"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import clsx from "clsx";

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: "blue" | "purple" | "green" | "yellow" | "indigo" | "pink" | "teal";
}

export default function KPICard({ title, value, icon: Icon, trend, color }: KPICardProps) {
    const colorConfig = {
        blue: {
            bg: "bg-blue-50/50",
            text: "text-blue-600",
            trend: "text-blue-600 bg-blue-50"
        },
        purple: {
            bg: "bg-purple-50/50",
            text: "text-purple-600",
            trend: "text-purple-600 bg-purple-50"
        },
        green: {
            bg: "bg-emerald-50/50",
            text: "text-emerald-600",
            trend: "text-emerald-600 bg-emerald-50"
        },
        yellow: {
            bg: "bg-amber-50/50",
            text: "text-amber-600",
            trend: "text-amber-600 bg-amber-50"
        },
        indigo: {
            bg: "bg-indigo-50/50",
            text: "text-indigo-600",
            trend: "text-indigo-600 bg-indigo-50"
        },
        pink: {
            bg: "bg-pink-50/50",
            text: "text-pink-600",
            trend: "text-pink-600 bg-pink-50"
        },
        teal: {
            bg: "bg-teal-50/50",
            text: "text-teal-600",
            trend: "text-teal-600 bg-teal-50"
        },
    };

    const config = colorConfig[color] || colorConfig.blue;
    const trendValue = parseFloat(trend?.replace(/[^0-9.-]/g, '') || '0');
    const isPositive = trendValue > 0;
    const isNeutral = trendValue === 0;

    return (
        <div className="group relative bg-white/60 backdrop-blur-md rounded-[20px] p-5 border border-white/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                    <div className={clsx("p-2.5 rounded-xl transition-colors", config.bg)}>
                        <Icon className={clsx("w-5 h-5", config.text)} />
                    </div>
                    {trend && (
                        <div className={clsx(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors",
                            isPositive ? "bg-emerald-50 text-emerald-600" :
                            isNeutral ? "bg-slate-50 text-slate-600" :
                            "bg-rose-50 text-rose-600"
                        )}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> :
                             isNeutral ? <Minus className="w-3 h-3" /> :
                             <TrendingDown className="w-3 h-3" />}
                            <span>{trend}</span>
                        </div>
                    )}
                </div>

                <div>
                    <div className="text-3xl font-semibold text-slate-900 tracking-tight mb-1 font-display">
                        {value}
                    </div>
                    <div className="text-[13px] font-medium text-slate-500">
                        {title}
                    </div>
                </div>
            </div>
        </div>
    );
}

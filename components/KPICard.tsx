"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: "blue" | "purple" | "green" | "yellow" | "indigo" | "pink" | "teal";
}

export default function KPICard({ title, value, icon: Icon, trend, color }: KPICardProps) {
    // Premium color configurations
    const colorConfig = {
        blue: {
            bg: "bg-gradient-to-br from-blue-500 to-blue-600",
            iconBg: "bg-blue-400/20",
            iconColor: "text-blue-100",
            glow: "shadow-blue-500/25",
        },
        purple: {
            bg: "bg-gradient-to-br from-violet-500 to-purple-600",
            iconBg: "bg-violet-400/20",
            iconColor: "text-violet-100",
            glow: "shadow-violet-500/25",
        },
        green: {
            bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
            iconBg: "bg-emerald-400/20",
            iconColor: "text-emerald-100",
            glow: "shadow-emerald-500/25",
        },
        yellow: {
            bg: "bg-gradient-to-br from-amber-400 to-orange-500",
            iconBg: "bg-amber-300/20",
            iconColor: "text-amber-100",
            glow: "shadow-amber-500/25",
        },
        indigo: {
            bg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
            iconBg: "bg-indigo-400/20",
            iconColor: "text-indigo-100",
            glow: "shadow-indigo-500/25",
        },
        pink: {
            bg: "bg-gradient-to-br from-pink-500 to-rose-600",
            iconBg: "bg-pink-400/20",
            iconColor: "text-pink-100",
            glow: "shadow-pink-500/25",
        },
        teal: {
            bg: "bg-gradient-to-br from-teal-500 to-cyan-600",
            iconBg: "bg-teal-400/20",
            iconColor: "text-teal-100",
            glow: "shadow-teal-500/25",
        },
    };

    const config = colorConfig[color] || colorConfig.teal;

    // Parse trend to determine direction
    const trendUp = trend && (trend.includes('+') || !trend.includes('-'));
    const TrendIcon = trendUp ? TrendingUp : TrendingDown;

    return (
        <div
            className={clsx(
                config.bg,
                "rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                config.glow
            )}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
                <div className={clsx(
                    "p-3 rounded-xl",
                    config.iconBg
                )}>
                    <Icon className={clsx("h-5 w-5", config.iconColor)} />
                </div>

                {trend && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                        <TrendIcon className="h-3 w-3" />
                        <span className="text-xs font-semibold">{trend}</span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="mb-1">
                <div className="text-3xl font-display font-bold tracking-tight">
                    {value}
                </div>
            </div>

            {/* Title */}
            <div className="text-sm font-medium text-white/80">
                {title}
            </div>

            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        </div>
    );
}

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
    // Apple-style color configurations
    const colorConfig = {
        blue: {
            iconBg: "bg-[#0071e3]/10",
            iconColor: "text-[#0071e3]",
        },
        purple: {
            iconBg: "bg-[#af52de]/10",
            iconColor: "text-[#af52de]",
        },
        green: {
            iconBg: "bg-[#34c759]/10",
            iconColor: "text-[#248a3d]",
        },
        yellow: {
            iconBg: "bg-[#ff9500]/10",
            iconColor: "text-[#c93400]",
        },
        indigo: {
            iconBg: "bg-[#5856d6]/10",
            iconColor: "text-[#5856d6]",
        },
        pink: {
            iconBg: "bg-[#ff2d55]/10",
            iconColor: "text-[#ff2d55]",
        },
        teal: {
            iconBg: "bg-[#5ac8fa]/10",
            iconColor: "text-[#0077ed]",
        },
    };

    const config = colorConfig[color] || colorConfig.blue;
    const trendUp = trend && (trend.includes('+') || !trend.includes('-'));
    const TrendIcon = trendUp ? TrendingUp : TrendingDown;

    return (
        <div className="card p-5 hover:shadow-lg transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className={clsx(
                    "p-2.5 rounded-xl",
                    config.iconBg
                )}>
                    <Icon className={clsx("h-5 w-5", config.iconColor)} />
                </div>

                {trend && (
                    <div className={clsx(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        trendUp
                            ? "bg-[#34c759]/10 text-[#248a3d]"
                            : "bg-[#ff3b30]/10 text-[#d70015]"
                    )}>
                        <TrendIcon className="h-3 w-3" />
                        <span>{trend}</span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="text-3xl font-display font-semibold text-[#1d1d1f] tracking-tight mb-1">
                {value}
            </div>

            {/* Title */}
            <div className="text-sm text-[#6e6e73]">
                {title}
            </div>
        </div>
    );
}

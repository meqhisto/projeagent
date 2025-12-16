"use client";

import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: "blue" | "purple" | "green" | "yellow" | "indigo" | "pink";
}

export default function KPICard({ title, value, icon: Icon, trend, color }: KPICardProps) {
    const gradients = {
        blue: "from-blue-500 to-blue-600",
        purple: "from-purple-500 to-purple-600",
        green: "from-green-500 to-green-600",
        yellow: "from-yellow-500 to-yellow-600",
        indigo: "from-indigo-500 to-indigo-600",
        pink: "from-pink-500 to-pink-600"
    };

    const iconBgs = {
        blue: "bg-blue-100",
        purple: "bg-purple-100",
        green: "bg-green-100",
        yellow: "bg-yellow-100",
        indigo: "bg-indigo-100",
        pink: "bg-pink-100"
    };

    return (
        <div className={`bg-gradient-to-br ${gradients[color]} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`${iconBgs[color]} ${color === 'yellow' ? 'text-yellow-700' : `text-${color}-700`} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                        {trend}
                    </span>
                )}
            </div>
            <div className="mb-1">
                <div className="text-3xl font-bold">{value}</div>
            </div>
            <div className="text-sm opacity-90">{title}</div>
        </div>
    );
}

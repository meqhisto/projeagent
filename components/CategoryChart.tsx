"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
    RESIDENTIAL: "#22C55E",
    COMMERCIAL: "#F97316",
    MIXED_USE: "#8B5CF6",
    INDUSTRIAL: "#64748B",
    AGRICULTURAL: "#84CC16",
    TOURISM: "#06B6D4",
    INVESTMENT: "#EAB308",
    DEVELOPMENT: "#EC4899",
    UNCATEGORIZED: "#94A3B8",
};

const CATEGORY_LABELS: Record<string, string> = {
    RESIDENTIAL: "Konut",
    COMMERCIAL: "Ticari",
    MIXED_USE: "Karma",
    INDUSTRIAL: "Sanayi",
    AGRICULTURAL: "Tarım",
    TOURISM: "Turizm",
    INVESTMENT: "Yatırım",
    DEVELOPMENT: "Geliştirme",
    UNCATEGORIZED: "Kategorisiz",
};

interface CategoryChartProps {
    parcels: Array<{ category?: string }>;
}

export default function CategoryChart({ parcels }: CategoryChartProps) {
    const counts: Record<string, number> = {};
    for (const p of parcels) {
        const cat = p.category || "UNCATEGORIZED";
        counts[cat] = (counts[cat] || 0) + 1;
    }

    const data = Object.entries(counts)
        .map(([key, value]) => ({
            name: CATEGORY_LABELS[key] || key,
            value,
            color: CATEGORY_COLORS[key] || "#94A3B8",
            key,
        }))
        .sort((a, b) => b.value - a.value);

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center justify-center">
                <p className="text-sm text-gray-400">Henüz parsel yok</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Kategori Dağılımı</h3>
            <p className="text-xs text-gray-400 mb-4">{parcels.length} parsel toplamda</p>
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [`${value} parsel`]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                    />
                    <Legend
                        formatter={(value) => <span style={{ fontSize: 11, color: "#6b7280" }}>{value}</span>}
                        iconType="circle"
                        iconSize={8}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

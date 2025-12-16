"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PipelineChartProps {
    data: Array<{ stage: string; count: number }>;
}

const STAGE_COLORS: Record<string, string> = {
    NEW_LEAD: "#3B82F6",      // blue
    CONTACTED: "#A855F7",     // purple
    ANALYSIS: "#EAB308",      // yellow
    OFFER_SENT: "#6366F1",    // indigo
    CONTRACT: "#22C55E",      // green
    LOST: "#6B7280"           // gray
};

const STAGE_NAMES: Record<string, string> = {
    NEW_LEAD: "Yeni Fırsat",
    CONTACTED: "İletişimde",
    ANALYSIS: "Analiz",
    OFFER_SENT: "Teklif Gönderildi",
    CONTRACT: "Sözleşme",
    LOST: "Kayıp"
};

export default function PipelineChart({ data }: PipelineChartProps) {
    const formattedData = data.map(item => ({
        ...item,
        name: STAGE_NAMES[item.stage] || item.stage
    }));

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline Dağılımı</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {formattedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STAGE_COLORS[data[index].stage] || "#3B82F6"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

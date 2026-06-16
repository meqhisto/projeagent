"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Search, Filter, ChevronRight, User, Building2, MapPin, RefreshCw, Trash2 } from "lucide-react";
import AddDemandModal from "@/components/AddDemandModal";

interface Demand {
    id: number;
    title: string;
    type: "PARCEL" | "PROPERTY" | "BOTH";
    status: "OPEN" | "MATCHED" | "CLOSED" | "CANCELLED";
    city?: string;
    district?: string;
    neighborhood?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    deadline?: string;
    notes?: string;
    createdAt: string;
    customer?: { id: number; name: string };
    createdBy: { id: number; name: string };
    _count: { matches: number };
}

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Açık",
    MATCHED: "Eşleşme Var",
    CLOSED: "Kapandı",
    CANCELLED: "İptal",
};

const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    MATCHED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
    CANCELLED: "bg-red-100 text-red-600",
};

const TYPE_LABELS: Record<string, string> = {
    PARCEL: "Arsa",
    PROPERTY: "Gayrimenkul",
    BOTH: "Arsa & Gayrimenkul",
};

function formatPrice(v?: number | null) {
    if (!v) return null;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ₺`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ₺`;
    return `${v} ₺`;
}

export default function DemandsPage() {
    const [demands, setDemands] = useState<Demand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [matching, setMatching] = useState<number | null>(null);

    const fetchDemands = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            const res = await fetch(`/api/demands?${params}`);
            if (res.ok) setDemands(await res.json());
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchDemands(); }, [fetchDemands]);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu talebi silmek istediğinizden emin misiniz?")) return;
        const res = await fetch(`/api/demands/${id}`, { method: "DELETE" });
        if (res.ok) fetchDemands();
    };

    const handleMatch = async (id: number) => {
        setMatching(id);
        try {
            const res = await fetch(`/api/demands/${id}/match`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                alert(`${data.matched} eşleşme bulundu.`);
                fetchDemands();
            }
        } finally {
            setMatching(null);
        }
    };

    const filtered = demands.filter(d => {
        const s = search.toLowerCase();
        return (
            d.title.toLowerCase().includes(s) ||
            d.customer?.name.toLowerCase().includes(s) ||
            d.city?.toLowerCase().includes(s) ||
            d.district?.toLowerCase().includes(s)
        );
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-[#1d1d1f]">Talepler</h1>
                        <p className="text-sm text-[#6e6e73]">{demands.length} talep</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] text-white text-sm font-medium rounded-xl hover:bg-[#0077ed] transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Talep
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e6e73]" />
                    <input
                        type="text"
                        placeholder="Başlık, müşteri, şehir ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 bg-white"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e6e73]" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2.5 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 bg-white appearance-none"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="OPEN">Açık</option>
                        <option value="MATCHED">Eşleşme Var</option>
                        <option value="CLOSED">Kapandı</option>
                        <option value="CANCELLED">İptal</option>
                    </select>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-48 text-[#6e6e73] text-sm">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[#6e6e73]">
                    <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Henüz talep yok</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-3 text-sm text-[#0071e3] hover:underline"
                    >
                        İlk talebi oluştur
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(d => (
                        <div key={d.id} className="bg-white border border-black/[0.06] rounded-2xl p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                                            {STATUS_LABELS[d.status]}
                                        </span>
                                        <span className="text-xs text-[#6e6e73] bg-gray-100 px-2 py-0.5 rounded-full">
                                            {TYPE_LABELS[d.type]}
                                        </span>
                                        {d._count.matches > 0 && (
                                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                {d._count.matches} eşleşme
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#1d1d1f] truncate">{d.title}</h3>
                                    <div className="flex flex-wrap gap-3 mt-1.5">
                                        {d.customer && (
                                            <span className="flex items-center gap-1 text-xs text-[#6e6e73]">
                                                <User className="h-3 w-3" />
                                                {d.customer.name}
                                            </span>
                                        )}
                                        {(d.city || d.district) && (
                                            <span className="flex items-center gap-1 text-xs text-[#6e6e73]">
                                                <MapPin className="h-3 w-3" />
                                                {[d.city, d.district, d.neighborhood].filter(Boolean).join(", ")}
                                            </span>
                                        )}
                                        {(d.minArea || d.maxArea) && (
                                            <span className="text-xs text-[#6e6e73]">
                                                {d.minArea && `${d.minArea}m²`}{d.minArea && d.maxArea && " – "}{d.maxArea && `${d.maxArea}m²`}
                                            </span>
                                        )}
                                        {(d.minPrice || d.maxPrice) && (
                                            <span className="text-xs text-[#6e6e73]">
                                                {formatPrice(d.minPrice)}{d.minPrice && d.maxPrice && " – "}{formatPrice(d.maxPrice)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleMatch(d.id)}
                                        disabled={matching === d.id}
                                        title="Portföyde eşleştir"
                                        className="p-2 text-[#6e6e73] hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-40"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${matching === d.id ? "animate-spin" : ""}`} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(d.id)}
                                        title="Sil"
                                        className="p-2 text-[#6e6e73] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <Link
                                        href={`/demands/${d.id}`}
                                        className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddDemandModal
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => { setShowAddModal(false); fetchDemands(); }}
                />
            )}
        </div>
    );
}

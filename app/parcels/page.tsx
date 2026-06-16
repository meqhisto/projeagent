"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Loader2, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import ParcelCard from "@/components/ParcelCard";
import AdvancedFilterPanel from "@/components/AdvancedFilterPanel";
import ExportButton from "@/components/ExportButton";
import ParcelCompareModal from "@/components/ParcelCompareModal";
import { Parcel } from "@/types";

export default function ParcelsPage() {
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<any>({});
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [compareOpen, setCompareOpen] = useState(false);

    const fetchParcels = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/parcels");
            if (res.ok) {
                const data = await res.json();
                setParcels(data);
            }
        } catch (error) {
            console.error("Failed to fetch parcels", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParcels();
    }, []);

    const filteredParcels = useMemo(() => {
        return parcels.filter(p => {
            if (filters.city && p.city !== filters.city) return false;
            if (filters.district && !p.district?.toLowerCase().includes(filters.district.toLowerCase())) return false;
            if (filters.areaMin && (!p.area || p.area < parseFloat(filters.areaMin))) return false;
            if (filters.areaMax && (!p.area || p.area > parseFloat(filters.areaMax))) return false;
            if (filters.crmStages?.length > 0 && !filters.crmStages.includes(p.crmStage || 'NEW_LEAD')) return false;
            if (filters.status && p.status !== filters.status) return false;
            if (filters.hasZoning === "true" && !p.zoning) return false;
            if (filters.hasZoning === "false" && p.zoning) return false;
            if (filters.category && p.category !== filters.category) return false;
            return true;
        });
    }, [parcels, filters]);

    const availableCities = useMemo(() => {
        return Array.from(new Set(parcels.map(p => p.city))).sort();
    }, [parcels]);

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else if (next.size < 5) next.add(id);
            return next;
        });
    };

    const selectedParcels = parcels.filter(p => selectedIds.has(p.id));

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[#1d1d1f] tracking-tight font-display">
                        Parsel Listesi
                    </h1>
                    <p className="text-[#6e6e73] mt-2 max-w-2xl font-medium text-[15px]">
                        Portföyünüzdeki tüm arsaları buradan yönetebilir, filtreleyebilir ve detaylı analizlerine ulaşabilirsiniz.
                        {filteredParcels.length > 0 && (
                            <span className="ml-2 font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full text-xs">
                                {filteredParcels.length} kayıt
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AdvancedFilterPanel
                        onFilterChange={setFilters}
                        availableCities={availableCities}
                    />
                    <ExportButton parcels={filteredParcels} />
                    <Link
                        href="/parcels/add"
                        className="flex items-center rounded-xl bg-[#0071e3] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Parsel Ekle
                    </Link>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="text-xs text-[#6e6e73] -mt-4">
                    {selectedIds.size} parsel seçildi · en fazla 5 seçebilirsiniz
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
                </div>
            ) : filteredParcels.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredParcels.map((parcel) => (
                        <div key={parcel.id} className="relative group">
                            {/* Checkbox overlay */}
                            <button
                                onClick={() => toggleSelect(parcel.id)}
                                className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    selectedIds.has(parcel.id)
                                        ? "bg-[#0071e3] border-[#0071e3]"
                                        : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                                }`}
                            >
                                {selectedIds.has(parcel.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                            <ParcelCard
                                id={parcel.id}
                                city={parcel.city}
                                district={parcel.district}
                                island={parcel.island}
                                parcel={parcel.parsel}
                                status={parcel.status}
                                imageUrl={parcel.images && parcel.images.length > 0 ? parcel.images[0].url : undefined}
                                zoning={parcel.zoning}
                                category={parcel.category}
                                tags={parcel.tags}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-black/[0.06] bg-white/50 backdrop-blur-sm p-16 text-center animate-slide-up">
                    <div className="rounded-2xl bg-white p-6 mb-6 shadow-sm border border-black/[0.04]">
                        <Search className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">Sonuç Bulunamadı</h3>
                    <p className="text-[#6e6e73] max-w-md mb-8 text-[15px]">
                        Arama kriterlerinize uygun parsel bulunamadı. Filtreleri değiştirerek tekrar deneyebilir veya yeni bir parsel ekleyebilirsiniz.
                    </p>
                    <button
                        onClick={() => setFilters({})}
                        className="text-[14px] font-semibold text-[#0071e3] hover:text-[#0077ed] bg-[#0071e3]/5 hover:bg-[#0071e3]/10 px-5 py-2.5 rounded-xl transition-all"
                    >
                        Filtreleri Temizle
                    </button>
                </div>
            )}

            {/* Sticky compare bar */}
            {selectedIds.size >= 2 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-[#1d1d1f] text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-black/30 animate-slide-up">
                    <span className="text-sm font-semibold">{selectedIds.size} parsel seçildi</span>
                    <button
                        onClick={() => setCompareOpen(true)}
                        className="flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        Karşılaştır
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        Temizle
                    </button>
                </div>
            )}

            {compareOpen && (
                <ParcelCompareModal
                    parcels={selectedParcels}
                    onClose={() => setCompareOpen(false)}
                />
            )}
        </div>
    );
}

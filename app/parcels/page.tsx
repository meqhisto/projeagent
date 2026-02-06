"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, FilterX } from "lucide-react";
import Link from "next/link";
import ParcelCard from "@/components/ParcelCard";
import AdvancedFilterPanel from "@/components/AdvancedFilterPanel";
import ExportButton from "@/components/ExportButton";

export default function ParcelsPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<any>({});

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

    // Apply filters
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Parsel Listesi
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-2xl">
                        Portföyünüzdeki tüm arsaları buradan yönetebilir, filtreleyebilir ve detaylı analizlerine ulaşabilirsiniz.
                        {filteredParcels.length > 0 && (
                            <span className="ml-1 font-medium text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full text-xs">
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
                        className="flex items-center rounded-xl bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Parsel Ekle
                    </Link>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-[340px] rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                    ))}
                </div>
            ) : filteredParcels.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredParcels.map((parcel) => (
                        <ParcelCard
                            key={parcel.id}
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
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center animate-slide-up">
                    <div className="rounded-full bg-white p-6 mb-6 shadow-sm ring-1 ring-slate-100">
                        <FilterX className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Sonuç Bulunamadı</h3>
                    <p className="text-slate-500 max-w-md mb-6">
                        Arama kriterlerinize uygun parsel bulunamadı. Filtreleri değiştirerek tekrar deneyebilir veya yeni bir parsel ekleyebilirsiniz.
                    </p>
                    <button
                        onClick={() => setFilters({})}
                        className="text-sm font-semibold text-[#0071e3] hover:text-[#0077ed] hover:bg-[#0071e3]/10 px-4 py-2 rounded-lg transition-colors"
                    >
                        Filtreleri Temizle
                    </button>
                </div>
            )}
        </div>
    );
}

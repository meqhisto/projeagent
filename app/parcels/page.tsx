"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, Building2 } from "lucide-react";
import AddParcelModal from "@/components/AddParcelModal";
import ParcelCard from "@/components/ParcelCard";
import AdvancedFilterPanel from "@/components/AdvancedFilterPanel";
import ExportButton from "@/components/ExportButton";

export default function ParcelsPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            return true;
        });
    }, [parcels, filters]);

    const availableCities = useMemo(() => {
        return Array.from(new Set(parcels.map(p => p.city))).sort();
    }, [parcels]);

    if (loading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-emerald-500" />
                        Parsel Listesi
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Toplam {filteredParcels.length} kayıt listeleniyor
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AdvancedFilterPanel
                        onFilterChange={setFilters}
                        availableCities={availableCities}
                    />
                    <ExportButton parcels={filteredParcels} />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Parsel Ekle
                    </button>
                </div>
            </div>

            {/* Grid */}
            {filteredParcels.length > 0 ? (
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
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-12 text-center">
                    <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
                        <Building2 className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Kayıt Bulunamadı</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        Arama kriterlerinize uygun parsel bulunamadı veya henüz hiç parsel eklenmemiş.
                    </p>
                    <button
                        onClick={() => setFilters({})}
                        className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-500 hover:underline"
                    >
                        Filtreleri Temizle
                    </button>
                </div>
            )}

            <AddParcelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchParcels}
            />
        </div>
    );
}

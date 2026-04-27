"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, X, Check, RotateCcw } from "lucide-react";
import { PARCEL_CATEGORIES } from "@/lib/validations";

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
    RESIDENTIAL: "Konut Arsası",
    COMMERCIAL: "Ticari Arsa",
    INDUSTRIAL: "Sanayi Arsası",
    AGRICULTURAL: "Tarım Arazisi",
    MIXED_USE: "Karma Kullanım",
    TOURISM: "Turizm Arsası",
    INVESTMENT: "Yatırım Amaçlı",
    DEVELOPMENT: "Geliştirme Arazisi",
    UNCATEGORIZED: "Kategorisiz",
};

interface AdvancedFilterPanelProps {
    onFilterChange: (filters: any) => void;
    availableCities: string[];
}

export default function AdvancedFilterPanel({ onFilterChange, availableCities }: AdvancedFilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        city: "",
        district: "",
        areaMin: "",
        areaMax: "",
        status: "",
        hasZoning: "",
        crmStages: [] as string[],
        category: ""
    });
    const panelRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleChange = (field: string, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        onFilterChange(filters);
        setIsOpen(false);
    };

    const clearFilters = () => {
        const resetFilters = {
            city: "",
            district: "",
            areaMin: "",
            areaMax: "",
            status: "",
            hasZoning: "",
            crmStages: [],
            category: ""
        };
        setFilters(resetFilters);
        onFilterChange({});
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isOpen
                    ? "border-[#0071e3] bg-[#0071e3]/10 text-[#0077ed]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0071e3] hover:text-[#0071e3]"
                    }`}
            >
                <Filter className="h-4 w-4" />
                Filtrele
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Detaylı Filtreleme</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* City Select */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">İl</label>
                            <select
                                value={filters.city}
                                onChange={(e) => handleChange("city", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                            >
                                <option value="">Tümü</option>
                                {availableCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        {/* District Input */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">İlçe</label>
                            <input
                                type="text"
                                value={filters.district}
                                onChange={(e) => handleChange("district", e.target.value)}
                                placeholder="İlçe ara..."
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                            />
                        </div>

                        {/* Area Range */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Min. Alan (m²)</label>
                                <input
                                    type="number"
                                    value={filters.areaMin}
                                    onChange={(e) => handleChange("areaMin", e.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Max. Alan (m²)</label>
                                <input
                                    type="number"
                                    value={filters.areaMax}
                                    onChange={(e) => handleChange("areaMax", e.target.value)}
                                    placeholder="INF"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Status Select */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Durum</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleChange("status", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                            >
                                <option value="">Tümü</option>
                                <option value="NEW">Yeni</option>
                                <option value="IN_PROGRESS">İşleniyor</option>
                                <option value="COMPLETED">Tamamlandı</option>
                            </select>
                        </div>

                        {/* Zoning Status */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">İmar Durumu</label>
                            <select
                                value={filters.hasZoning}
                                onChange={(e) => handleChange("hasZoning", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                            >
                                <option value="">Farketmez</option>
                                <option value="true">İmarlı</option>
                                <option value="false">İmarsız</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">Kategori</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleChange("category", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#0071e3] focus:outline-none"
                            >
                                <option value="">Tümü</option>
                                {PARCEL_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {CATEGORY_LABELS[cat] || cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Temizle
                        </button>
                        <button
                            onClick={applyFilters}
                            className="flex items-center gap-2 rounded-lg bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0077ed]"
                        >
                            <Check className="h-4 w-4" />
                            Uygula
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

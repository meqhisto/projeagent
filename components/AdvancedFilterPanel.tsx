"use client";

import { useState, useEffect } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

interface FilterPanelProps {
    onFilterChange: (filters: any) => void;
    availableCities: string[];
}

export default function AdvancedFilterPanel({ onFilterChange, availableCities }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        city: "",
        district: "",
        areaMin: "",
        areaMax: "",
        crmStages: [] as string[],
        status: "",
        hasZoning: "",
    });

    const crmStages = [
        { value: "NEW_LEAD", label: "Yeni Fırsat" },
        { value: "CONTACTED", label: "İletişimde" },
        { value: "ANALYSIS", label: "Analiz" },
        { value: "OFFER_SENT", label: "Teklif Gönderildi" },
        { value: "CONTRACT", label: "Sözleşme" },
        { value: "LOST", label: "Kayıp" },
    ];

    const statuses = [
        { value: "PENDING", label: "Beklemede" },
        { value: "RESEARCHING", label: "Araştırılıyor" },
        { value: "COMPLETED", label: "Tamamlandı" },
    ];

    const handleCrmStageToggle = (stage: string) => {
        const newStages = filters.crmStages.includes(stage)
            ? filters.crmStages.filter(s => s !== stage)
            : [...filters.crmStages, stage];

        setFilters(prev => ({ ...prev, crmStages: newStages }));
    };

    const applyFilters = () => {
        onFilterChange(filters);
        setIsOpen(false);
    };

    const clearFilters = () => {
        const emptyFilters = {
            city: "",
            district: "",
            areaMin: "",
            areaMax: "",
            crmStages: [],
            status: "",
            hasZoning: "",
        };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    const activeFilterCount = [
        filters.city,
        filters.district,
        filters.areaMin,
        filters.areaMax,
        filters.crmStages.length > 0,
        filters.status,
        filters.hasZoning,
    ].filter(Boolean).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors relative"
            >
                <Filter className="h-4 w-4" />
                Filtreler
                {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Gelişmiş Filtreler</h3>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                                <select
                                    value={filters.city}
                                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Tümü</option>
                                    {availableCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                                <input
                                    type="text"
                                    value={filters.district}
                                    onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                                    placeholder="İlçe adı..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Area Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alan (m²)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={filters.areaMin}
                                        onChange={(e) => setFilters(prev => ({ ...prev, areaMin: e.target.value }))}
                                        placeholder="Min"
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="number"
                                        value={filters.areaMax}
                                        onChange={(e) => setFilters(prev => ({ ...prev, areaMax: e.target.value }))}
                                        placeholder="Max"
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* CRM Stages */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">CRM Aşaması</label>
                                <div className="space-y-2">
                                    {crmStages.map(stage => (
                                        <label key={stage.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.crmStages.includes(stage.value)}
                                                onChange={() => handleCrmStageToggle(stage.value)}
                                                className="rounded text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-700">{stage.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Tümü</option>
                                    {statuses.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Zoning */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">İmar Durumu</label>
                                <select
                                    value={filters.hasZoning}
                                    onChange={(e) => setFilters(prev => ({ ...prev, hasZoning: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Tümü</option>
                                    <option value="true">İmar Bilgisi Var</option>
                                    <option value="false">İmar Bilgisi Yok</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Temizle
                            </button>
                            <button
                                onClick={applyFilters}
                                className="flex-1 px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium text-white hover:bg-purple-700 transition-colors"
                            >
                                Uygula
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, Loader2, Info, Calculator, Zap, ExternalLink } from "lucide-react";

interface ZoningPrecedent {
    type: string;
    ks: number | null;
    taks: number | null;
    maxHeight: number | null;
    notes: string | null;
}

interface ZoningEditProps {
    parcelId: number;
    city: string;
    district: string;
    neighborhood: string;
    parcelArea?: number; // Added prop
    initialZoning?: any;
    onUpdate: () => void;
}

function zoningTypeToTab(zoningType?: string | null): "RESIDENTIAL" | "COMMERCIAL" | "MIXED" {
    if (!zoningType) return "RESIDENTIAL";
    const t = zoningType.toLowerCase();
    if (t.includes("ticari") || t.includes("ticaret") || t.includes("commercial")) return "COMMERCIAL";
    if (t.includes("karma") || t.includes("mixed")) return "MIXED";
    return "RESIDENTIAL";
}

export default function ZoningEditSection({
    parcelId, city, district, neighborhood, parcelArea, initialZoning, onUpdate
}: ZoningEditProps) {
    const [activeTab, setActiveTab] = useState<"RESIDENTIAL" | "COMMERCIAL" | "MIXED">(
        () => zoningTypeToTab(initialZoning?.zoningType)
    );
    const [loading, setLoading] = useState(false);
    const [precedents, setPrecedents] = useState<Record<string, ZoningPrecedent>>({});
    const [precedentsLoaded, setPrecedentsLoaded] = useState(false);

    // Form State — pre-fill from fetched imar data
    const [ks, setKs] = useState<string>(initialZoning?.ks?.toString() || "");
    const [taks, setTaks] = useState<string>(initialZoning?.taks?.toString() || "");
    const [maxHeight, setMaxHeight] = useState<string>(initialZoning?.maxHeight?.toString() || "");
    const [notes, setNotes] = useState<string>(initialZoning?.notes || "");

    useEffect(() => {
        fetchPrecedents();
    }, [city, district, neighborhood]);

    useEffect(() => {
        if (precedentsLoaded) loadTabData(activeTab);
    }, [activeTab, precedents, precedentsLoaded]);

    // Calculation Logic (Hybrid Engine)
    const [constructionArea, setConstructionArea] = useState<string | null>(null);

    useEffect(() => {
        const calculateWithPython = async () => {
            if (!parcelArea || !ks) {
                setConstructionArea(null);
                return;
            }

            try {
                // Call Python Logic Engine
                const res = await fetch('/api/proxy/calculate/basic', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parcel_area: parcelArea,
                        ks: parseFloat(ks) || 0,
                        taks: parseFloat(taks) || 0
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    setConstructionArea(data.total_construction_area.toString());
                } else {
                    // Fallback or Error
                    console.warn("Python Engine Unreachable, falling back to local");
                    const ksValue = parseFloat(ks);
                    if (!isNaN(ksValue)) {
                        setConstructionArea((parcelArea * ksValue).toFixed(2));
                    }
                }
            } catch (e) {
                console.error("Engine Error", e);
                // Fallback
                const ksValue = parseFloat(ks);
                if (!isNaN(ksValue)) {
                    setConstructionArea((parcelArea * ksValue).toFixed(2));
                }
            }
        };

        // Debounce slightly to avoid too many requests
        const timer = setTimeout(() => {
            calculateWithPython();
        }, 500);

        return () => clearTimeout(timer);

    }, [parcelArea, ks, taks]);

    const fetchPrecedents = async () => {
        try {
            const res = await fetch(`/api/precedents?city=${city}&district=${district}&neighborhood=${neighborhood}`);
            if (res.ok) {
                const data: ZoningPrecedent[] = await res.json();
                const map: Record<string, ZoningPrecedent> = {};
                data.forEach(p => map[p.type] = p);
                setPrecedents(map);
            }
        } catch (e) {
            console.error("Precedent fetch error", e);
        } finally {
            setPrecedentsLoaded(true);
        }
    };

    const loadTabData = (type: string) => {
        const p = precedents[type];
        if (p) {
            // Precedent verisi varsa kullan (daha önce kaydedilmiş mahalle hafızası)
            setKs(p.ks?.toString() || "");
            setTaks(p.taks?.toString() || "");
            setMaxHeight(p.maxHeight?.toString() || "");
            setNotes(p.notes || "");
        }
        // Precedent yoksa initialZoning'i koruyalım (zaten state'e yüklendi)
    };

    const applyImarData = () => {
        if (!initialZoning) return;
        setKs(initialZoning.ks?.toString() || "");
        setTaks(initialZoning.taks?.toString() || "");
        setMaxHeight(initialZoning.maxHeight?.toString() || "");
        setNotes(initialZoning.notes || "");
        setActiveTab(zoningTypeToTab(initialZoning.zoningType));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // 1. Save as Precedent (Memory)
            await fetch("/api/precedents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    city, district, neighborhood,
                    type: activeTab,
                    ks: ks || 0,
                    taks: taks || 0,
                    maxHeight: maxHeight || 0,
                    notes
                })
            });

            // 2. Apply to current parcel
            await fetch(`/api/parcels/${parcelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    zoningType: activeTab === "RESIDENTIAL" ? "Konut" : activeTab === "COMMERCIAL" ? "Ticari" : "Karma",
                    ks: ks || 0,
                    taks: taks || 0,
                    maxHeight: maxHeight || 0,
                    notes
                })
            });

            await fetchPrecedents();
            onUpdate();
            alert("Bilgiler kaydedildi ve mahalleye işlendi.");
        } catch (e) {
            console.error(e);
            alert("Hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case "RESIDENTIAL": return "Konut";
            case "COMMERCIAL": return "Ticari";
            case "MIXED": return "Karma";
                return type;
        }
    };

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                    <Info className="mr-2 h-4 w-4 text-[#0071e3]" />
                    İmar Verisi (Mahalle Hafızası)
                </h3>
            </div>

            {/* Auto-fetched imar data banner */}
            {initialZoning?.sourceUrl && (
                <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                        <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        Belediye imar sitesinden otomatik çekildi:
                        <span className="font-bold">
                            {initialZoning.zoningType || "—"} · KAKS {initialZoning.ks ?? "—"} · TAKS {initialZoning.taks ?? "—"} · Hmax {initialZoning.maxHeight ?? "—"}
                        </span>
                    </div>
                    <button
                        onClick={applyImarData}
                        className="shrink-0 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Zap className="h-3 w-3" />
                        Forma Uygula
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-100 mb-6">
                {(["RESIDENTIAL", "COMMERCIAL", "MIXED"] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === type
                            ? "border-[#0071e3] text-[#0077ed]"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                            }`}
                    >
                        {getLabel(type)}
                    </button>
                ))}
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Emsal (KAKS)</label>
                    <input
                        type="number" step="0.01"
                        value={ks} onChange={e => setKs(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                        placeholder="Örn: 1.50"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">TAKS</label>
                    <input
                        type="number" step="0.01"
                        value={taks} onChange={e => setTaks(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                        placeholder="Örn: 0.40"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hmax (Yükseklik)</label>
                    <input
                        type="number" step="0.5"
                        value={maxHeight} onChange={e => setMaxHeight(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                        placeholder="Örn: 12.50"
                    />
                </div>
            </div>

            {/* Calculation Result */}
            {constructionArea && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center text-blue-800 text-sm font-medium">
                        <Calculator className="h-4 w-4 mr-2" />
                        Tahmini İnşaat Alanı (Emsal x Alan)
                    </div>
                    <div className="text-blue-900 font-bold text-lg">
                        {new Intl.NumberFormat('tr-TR').format(parseFloat(constructionArea))} m²
                    </div>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                    rows={3}
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]"
                    placeholder="Bu imar kuralı hakkında notlar..."
                />
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center rounded-lg bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Kaydet ve Parsele Uygula
                </button>
            </div>
            <p className="mt-2 text-xs text-gray-400 text-right">
                * Kaydettiğiniz veriler "{neighborhood}" mahallesi için {getLabel(activeTab)} referansı olarak saklanacaktır.
            </p>

        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, Tag, Save } from "lucide-react";
import { PARCEL_CATEGORIES } from "@/lib/validations";
import clsx from "clsx";

interface EditParcelDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    parcelId: number;
}

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

export default function EditParcelDrawer({ isOpen, onClose, onSuccess, parcelId }: EditParcelDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const [formData, setFormData] = useState({
        category: "UNCATEGORIZED",
        tags: "",
    });

    const [parcelInfo, setParcelInfo] = useState<{
        city: string;
        district: string;
        island: string;
        parsel: string;
    } | null>(null);

    // Animation control
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            fetchParcelData();
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const fetchParcelData = async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await fetch(`/api/parcels/${parcelId}`);
            if (!res.ok) throw new Error("Parsel bulunamadı");
            const data = await res.json();
            setFormData({
                category: data.category || "UNCATEGORIZED",
                tags: data.tags || "",
            });
            setParcelInfo({
                city: data.city,
                district: data.district,
                island: data.island,
                parsel: data.parsel,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/parcels/${parcelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: formData.category,
                    tags: formData.tags.trim() || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Güncelleme başarısız");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen && !isVisible) return null;

    return (
        <div
            className={clsx(
                "fixed inset-0 z-[100] flex justify-end transition-all duration-300",
                isOpen ? "bg-black/20 backdrop-blur-sm pointer-events-auto" : "bg-transparent pointer-events-none"
            )}
            onClick={onClose}
        >
            <div
                className={clsx(
                    "h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Parsel Düzenle</h3>
                        {parcelInfo && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                {parcelInfo.city} / {parcelInfo.district} - Ada {parcelInfo.island} / Parsel {parcelInfo.parsel}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {fetching ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Category */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                >
                                    {PARCEL_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {CATEGORY_LABELS[cat] || cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Etiketler</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    placeholder="deniz manzarası, köşe parsel, yola cepheli"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                />
                                <p className="text-xs text-slate-400">Virgülle ayırarak birden fazla etiket ekleyebilirsiniz</p>
                            </div>

                            {/* Preview */}
                            {formData.tags && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Etiket Önizleme</label>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.split(",").filter(t => t.trim()).map((tag, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                <Tag className="h-3 w-3" />
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center gap-3 border-t border-slate-100 bg-white p-5">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || fetching}
                        className="flex items-center justify-center rounded-xl bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}

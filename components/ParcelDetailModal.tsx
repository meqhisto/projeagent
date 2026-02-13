"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Parcel, Interaction, Customer } from "@/types";

interface ParcelDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    parcelId: number;
}

export default function ParcelDetailModal({ isOpen, onClose, parcelId }: ParcelDetailModalProps) {
    const [parcel, setParcel] = useState<Parcel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParcelDetails = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/parcels/${parcelId}`);
                if (res.ok) {
                    const data = await res.json();
                    setParcel(data);
                }
            } catch (error) {
                console.error("Failed to fetch parcel", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && parcelId) {
            fetchParcelDetails();
        }
    }, [isOpen, parcelId]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Parsel Hızlı Bakış</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500" aria-label="Kapat">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071e3]"></div>
                    </div>
                ) : parcel ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Hero Section */}
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            {/* Image */}
                            <div className="w-full md:w-1/2 h-48 rounded-xl bg-slate-100 overflow-hidden relative shadow-md">
                                {parcel.images && parcel.images.length > 0 ? (
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${parcel.images[0].url})` }} />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-400">
                                        <MapPin className="h-12 w-12 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-md">
                                    {parcel.status === "RESEARCHING" ? "Araştırılıyor" : parcel.status === "COMPLETED" ? "Tamamlandı" : "Bekliyor"}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="w-full md:w-1/2 space-y-4">
                                <div>
                                    <div className="text-xs text-[#0071e3] font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> {parcel.city} / {parcel.district}
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">{parcel.island} Ada / {parcel.parsel} Parsel</h2>
                                    <div className="text-sm text-gray-500 mt-1">{parcel.neighborhood} Mahallesi</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Alan</div>
                                        <div className="font-semibold text-gray-900">{parcel.area ? `${parcel.area} m²` : '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Emsal</div>
                                        <div className="font-semibold text-gray-900">{parcel.zoning?.ks ? parcel.zoning.ks : '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Interactions Preview */}
                        {parcel.interactions && parcel.interactions.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Son Etkileşimler</h4>
                                <div className="space-y-3">
                                    {parcel.interactions?.slice(0, 3).map((interaction: Interaction) => (
                                        <div key={interaction.id} className="flex gap-3 text-sm p-3 rounded-lg bg-gray-50 border border-gray-100">
                                            <div className="font-bold text-gray-700 w-24 shrink-0">{interaction.type}</div>
                                            <div className="text-gray-600 line-clamp-1">{interaction.content}</div>
                                            <div className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                                                {new Date(interaction.date).toLocaleDateString("tr-TR")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stakeholders Preview */}
                        {parcel.stakeholders && parcel.stakeholders.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">İlgili Kişiler</h4>
                                <div className="flex flex-wrap gap-2">
                                    {parcel.stakeholders?.map((s: Customer) => (
                                        <span key={s.id} className="text-xs font-medium px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">
                                            {s.name} ({s.role})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
                        Parsel detayları yüklenemedi.
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        Kapat
                    </button>
                    <Link
                        href={`/parcels/${parcelId}`}
                        className="px-4 py-2 text-sm font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        onClick={onClose}
                    >
                        Tam Detayları Gör <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

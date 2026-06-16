"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, ClipboardList, RefreshCw, MapPin, Building2, Star,
    CheckCircle2, XCircle, Eye, Presentation, User, Calendar
} from "lucide-react";

interface Match {
    id: number;
    score: number;
    status: string;
    parcel?: {
        id: number;
        city: string;
        district: string;
        neighborhood: string;
        island: string;
        parsel: string;
        area?: number;
        askingPrice?: number;
        category: string;
        zoning?: { ks?: number; taks?: number; maxHeight?: number; zoningType?: string } | null;
        images?: { url: string }[];
    } | null;
    property?: {
        id: number;
        title: string;
        type: string;
        city: string;
        district: string;
        neighborhood: string;
        netArea?: number;
        grossArea?: number;
        listingPrice?: number;
        currentValue?: number;
        roomType?: string;
        images?: { url: string }[];
    } | null;
}

interface Demand {
    id: number;
    title: string;
    type: string;
    status: string;
    city?: string;
    district?: string;
    neighborhood?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    parcelCategory?: string;
    minKAKS?: number;
    maxKAKS?: number;
    zoningType?: string;
    propertyType?: string;
    roomType?: string;
    hasElevator?: boolean;
    hasParking?: boolean;
    notes?: string;
    deadline?: string;
    customer?: { name: string; phone?: string; email?: string } | null;
    createdBy: { name: string };
    matches: Match[];
}

const MATCH_STATUS_LABELS: Record<string, string> = {
    SUGGESTED: "Önerilen",
    VIEWED: "Görüntülendi",
    PRESENTED: "Sunuldu",
    ACCEPTED: "Kabul Edildi",
    REJECTED: "Reddedildi",
};

const MATCH_STATUS_COLORS: Record<string, string> = {
    SUGGESTED: "bg-blue-50 text-blue-600",
    VIEWED: "bg-yellow-50 text-yellow-700",
    PRESENTED: "bg-purple-50 text-purple-700",
    ACCEPTED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-600",
};

function formatPrice(v?: number | null) {
    if (!v) return "–";
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ₺`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ₺`;
    return `${v} ₺`;
}

function ScoreBar({ score }: { score: number }) {
    const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs font-semibold text-[#1d1d1f] w-8 text-right">{score}</span>
        </div>
    );
}

export default function DemandDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [demand, setDemand] = useState<Demand | null>(null);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [updatingMatch, setUpdatingMatch] = useState<number | null>(null);

    const fetchDemand = useCallback(async () => {
        const res = await fetch(`/api/demands/${id}`);
        if (res.ok) setDemand(await res.json());
        setLoading(false);
    }, [id]);

    useEffect(() => { fetchDemand(); }, [fetchDemand]);

    const handleMatch = async () => {
        setMatching(true);
        try {
            const res = await fetch(`/api/demands/${id}/match`, { method: "POST" });
            if (res.ok) fetchDemand();
        } finally {
            setMatching(false);
        }
    };

    const updateMatchStatus = async (matchId: number, status: string) => {
        setUpdatingMatch(matchId);
        try {
            await fetch(`/api/demands/${id}/matches`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, status }),
            });
            fetchDemand();
        } finally {
            setUpdatingMatch(null);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-sm text-[#6e6e73]">Yükleniyor...</div>;
    }
    if (!demand) {
        return <div className="p-6 text-sm text-red-500">Talep bulunamadı.</div>;
    }

    const sortedMatches = [...demand.matches].sort((a, b) => b.score - a.score);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Back + Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.push("/demands")}
                    className="p-2 hover:bg-black/[0.04] rounded-xl transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 text-[#6e6e73]" />
                </button>
                <ClipboardList className="h-5 w-5 text-purple-500" />
                <h1 className="text-lg font-semibold text-[#1d1d1f] flex-1 truncate">{demand.title}</h1>
                <button
                    onClick={handleMatch}
                    disabled={matching}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${matching ? "animate-spin" : ""}`} />
                    Eşleştir
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Criteria panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
                        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Talep Bilgileri</h2>
                        <dl className="space-y-2 text-sm">
                            {demand.customer && (
                                <div className="flex items-start gap-2">
                                    <User className="h-3.5 w-3.5 text-[#6e6e73] mt-0.5 shrink-0" />
                                    <div>
                                        <dt className="text-xs text-[#6e6e73]">Müşteri</dt>
                                        <dd className="text-[#1d1d1f] font-medium">{demand.customer.name}</dd>
                                    </div>
                                </div>
                            )}
                            {(demand.city || demand.district) && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-[#6e6e73] mt-0.5 shrink-0" />
                                    <div>
                                        <dt className="text-xs text-[#6e6e73]">Konum</dt>
                                        <dd className="text-[#1d1d1f]">
                                            {[demand.city, demand.district, demand.neighborhood].filter(Boolean).join(", ")}
                                        </dd>
                                    </div>
                                </div>
                            )}
                            {(demand.minArea || demand.maxArea) && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">Alan</dt>
                                    <dd className="text-[#1d1d1f]">
                                        {demand.minArea && `${demand.minArea} m²`}
                                        {demand.minArea && demand.maxArea && " – "}
                                        {demand.maxArea && `${demand.maxArea} m²`}
                                    </dd>
                                </div>
                            )}
                            {(demand.minPrice || demand.maxPrice) && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">Fiyat</dt>
                                    <dd className="text-[#1d1d1f]">
                                        {formatPrice(demand.minPrice)}
                                        {demand.minPrice && demand.maxPrice && " – "}
                                        {formatPrice(demand.maxPrice)}
                                    </dd>
                                </div>
                            )}
                            {demand.parcelCategory && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">Arsa Kategorisi</dt>
                                    <dd className="text-[#1d1d1f]">{demand.parcelCategory}</dd>
                                </div>
                            )}
                            {(demand.minKAKS || demand.maxKAKS) && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">KAKS (Emsal)</dt>
                                    <dd className="text-[#1d1d1f]">
                                        {demand.minKAKS ?? "–"} – {demand.maxKAKS ?? "–"}
                                    </dd>
                                </div>
                            )}
                            {demand.zoningType && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">İmar Türü</dt>
                                    <dd className="text-[#1d1d1f]">{demand.zoningType}</dd>
                                </div>
                            )}
                            {demand.propertyType && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">Gayrimenkul Tipi</dt>
                                    <dd className="text-[#1d1d1f]">{demand.propertyType}</dd>
                                </div>
                            )}
                            {demand.roomType && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">Oda Tipi</dt>
                                    <dd className="text-[#1d1d1f]">{demand.roomType}</dd>
                                </div>
                            )}
                            {demand.deadline && (
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-[#6e6e73] mt-0.5 shrink-0" />
                                    <div>
                                        <dt className="text-xs text-[#6e6e73]">Son Tarih</dt>
                                        <dd className="text-[#1d1d1f]">{new Date(demand.deadline).toLocaleDateString("tr-TR")}</dd>
                                    </div>
                                </div>
                            )}
                            {demand.notes && (
                                <div>
                                    <dt className="text-xs text-[#6e6e73]">Notlar</dt>
                                    <dd className="text-[#1d1d1f] text-xs whitespace-pre-wrap">{demand.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Matches */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#1d1d1f]">
                            Eşleşmeler
                            {sortedMatches.length > 0 && (
                                <span className="ml-2 text-xs font-normal text-[#6e6e73]">({sortedMatches.length})</span>
                            )}
                        </h2>
                    </div>

                    {sortedMatches.length === 0 ? (
                        <div className="bg-white border border-black/[0.06] rounded-2xl p-8 text-center text-[#6e6e73]">
                            <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Henüz eşleşme yok.</p>
                            <button
                                onClick={handleMatch}
                                className="mt-3 text-sm text-purple-600 hover:underline"
                            >
                                Eşleştirmeyi çalıştır
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedMatches.map(m => {
                                const isParcel = !!m.parcel;
                                const item = m.parcel || m.property;
                                if (!item) return null;

                                return (
                                    <div key={m.id} className="bg-white border border-black/[0.06] rounded-2xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isParcel ? "bg-green-100" : "bg-blue-100"}`}>
                                                    {isParcel
                                                        ? <MapPin className="h-4 w-4 text-green-600" />
                                                        : <Building2 className="h-4 w-4 text-blue-600" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-[#6e6e73]">{isParcel ? "Arsa" : "Gayrimenkul"}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${MATCH_STATUS_COLORS[m.status]}`}>
                                                            {MATCH_STATUS_LABELS[m.status]}
                                                        </span>
                                                    </div>
                                                    {isParcel && m.parcel && (
                                                        <p className="text-sm font-medium text-[#1d1d1f] truncate">
                                                            Ada {m.parcel.island} / Parsel {m.parcel.parsel}
                                                        </p>
                                                    )}
                                                    {!isParcel && m.property && (
                                                        <p className="text-sm font-medium text-[#1d1d1f] truncate">{m.property.title}</p>
                                                    )}
                                                    <p className="text-xs text-[#6e6e73]">
                                                        {isParcel && m.parcel
                                                            ? `${m.parcel.city}, ${m.parcel.district}, ${m.parcel.neighborhood}${m.parcel.area ? ` · ${m.parcel.area} m²` : ""}${m.parcel.askingPrice ? ` · ${formatPrice(m.parcel.askingPrice)}` : ""}`
                                                            : m.property
                                                                ? `${m.property.city}, ${m.property.district}${m.property.netArea ? ` · ${m.property.netArea} m²` : ""}${m.property.listingPrice ? ` · ${formatPrice(m.property.listingPrice)}` : ""}`
                                                                : ""
                                                        }
                                                    </p>
                                                    {isParcel && m.parcel?.zoning?.ks && (
                                                        <p className="text-xs text-[#6e6e73]">KAKS: {m.parcel.zoning.ks}</p>
                                                    )}
                                                    <div className="mt-2 w-32">
                                                        <ScoreBar score={m.score} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {m.status === "SUGGESTED" && (
                                                    <button
                                                        onClick={() => updateMatchStatus(m.id, "VIEWED")}
                                                        disabled={updatingMatch === m.id}
                                                        title="Görüntülendi olarak işaretle"
                                                        className="p-1.5 text-[#6e6e73] hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {["VIEWED", "PRESENTED"].includes(m.status) && (
                                                    <>
                                                        <button
                                                            onClick={() => updateMatchStatus(m.id, "ACCEPTED")}
                                                            disabled={updatingMatch === m.id}
                                                            title="Kabul et"
                                                            className="p-1.5 text-[#6e6e73] hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateMatchStatus(m.id, "REJECTED")}
                                                            disabled={updatingMatch === m.id}
                                                            title="Reddet"
                                                            className="p-1.5 text-[#6e6e73] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={isParcel ? `/parcels/${m.parcel?.id}` : `/properties/${m.property?.id}`}
                                                    className="p-1.5 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors"
                                                    title="Detay sayfasına git"
                                                >
                                                    <Presentation className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

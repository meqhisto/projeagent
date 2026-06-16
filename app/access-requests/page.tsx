"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Clock, CheckCircle2, XCircle, MapPin, Building2, User, ChevronDown } from "lucide-react";

interface AccessRequest {
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    message?: string;
    ownerNote?: string;
    shareArea: boolean;
    shareZoning: boolean;
    sharePrice: boolean;
    shareCrmStage: boolean;
    shareNotes: boolean;
    shareContacts: boolean;
    shareOwnerInfo: boolean;
    createdAt: string;
    requester: { id: number; name: string; email: string };
    parcel?: { id: number; city: string; district: string; neighborhood: string; island: string; parsel: string; area?: number; category: string } | null;
    property?: { id: number; title: string; type: string; city: string; district: string; neighborhood: string } | null;
    demandMatch?: { id: number; score: number } | null;
}

interface ApproveFormState {
    ownerNote: string;
    shareArea: boolean;
    shareZoning: boolean;
    sharePrice: boolean;
    shareCrmStage: boolean;
    shareNotes: boolean;
    shareContacts: boolean;
    shareOwnerInfo: boolean;
}

const STATUS_LABELS: Record<string, string> = { PENDING: "Beklemede", APPROVED: "Onaylandı", REJECTED: "Reddedildi" };
const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-600",
};

export default function AccessRequestsPage() {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"received" | "sent">("received");
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [approving, setApproving] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [forms, setForms] = useState<Record<number, ApproveFormState>>({});

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ role: tab === "received" ? "owner" : "requester" });
            if (statusFilter) params.set("status", statusFilter);
            const res = await fetch(`/api/access-requests?${params}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
                // Form state başlat
                const initForms: Record<number, ApproveFormState> = {};
                data.forEach((r: AccessRequest) => {
                    initForms[r.id] = {
                        ownerNote: r.ownerNote || "",
                        shareArea:      r.shareArea,
                        shareZoning:    r.shareZoning,
                        sharePrice:     r.sharePrice,
                        shareCrmStage:  r.shareCrmStage,
                        shareNotes:     r.shareNotes,
                        shareContacts:  r.shareContacts,
                        shareOwnerInfo: r.shareOwnerInfo,
                    };
                });
                setForms(initForms);
            }
        } finally {
            setLoading(false);
        }
    }, [tab, statusFilter]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleDecision = async (id: number, status: "APPROVED" | "REJECTED") => {
        setApproving(id);
        try {
            const form = forms[id];
            const res = await fetch(`/api/access-requests/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, ...form }),
            });
            if (res.ok) {
                setExpanded(null);
                fetchRequests();
            } else {
                const d = await res.json();
                alert(d.error || "İşlem başarısız");
            }
        } finally {
            setApproving(null);
        }
    };

    const updateForm = (id: number, key: keyof ApproveFormState, value: boolean | string) => {
        setForms(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
    };

    const shareFields = [
        { key: "shareArea" as const,      label: "Alan (m²)",            alwaysOk: true },
        { key: "shareZoning" as const,    label: "İmar Bilgileri (KAKS, TAKS, Hmax)", alwaysOk: true },
        { key: "sharePrice" as const,     label: "İlan / Satış Fiyatı",  alwaysOk: false },
        { key: "shareCrmStage" as const,  label: "CRM Aşaması",           alwaysOk: false },
        { key: "shareNotes" as const,     label: "Notlar",                alwaysOk: false },
        { key: "shareContacts" as const,  label: "Paydaşlar & Müşteriler", alwaysOk: false },
        { key: "shareOwnerInfo" as const, label: "Sahip İletişim Bilgileri", alwaysOk: false },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-[#1d1d1f]">Erişim Talepleri</h1>
                    <p className="text-sm text-[#6e6e73]">Portföy detay erişim yönetimi</p>
                </div>
            </div>

            {/* Tabs + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex gap-1 bg-black/[0.04] p-1 rounded-xl">
                    <button
                        onClick={() => setTab("received")}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg transition-all ${tab === "received" ? "bg-white shadow-sm font-medium text-[#1d1d1f]" : "text-[#6e6e73]"}`}
                    >
                        Gelen Talepler
                    </button>
                    <button
                        onClick={() => setTab("sent")}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg transition-all ${tab === "sent" ? "bg-white shadow-sm font-medium text-[#1d1d1f]" : "text-[#6e6e73]"}`}
                    >
                        Gönderilen Talepler
                    </button>
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none bg-white"
                >
                    <option value="">Tüm Durumlar</option>
                    <option value="PENDING">Beklemede</option>
                    <option value="APPROVED">Onaylandı</option>
                    <option value="REJECTED">Reddedildi</option>
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-40 text-sm text-[#6e6e73]">Yükleniyor...</div>
            ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-[#6e6e73]">
                    <Lock className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">Henüz talep yok</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(r => {
                        const isParcel = !!r.parcel;
                        const item = r.parcel || r.property;
                        const form = forms[r.id];
                        const isOpen = expanded === r.id;

                        return (
                            <div key={r.id} className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
                                {/* Card header */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isParcel ? "bg-green-100" : "bg-blue-100"}`}>
                                                {isParcel
                                                    ? <MapPin className="h-4 w-4 text-green-600" />
                                                    : <Building2 className="h-4 w-4 text-blue-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                                                        {STATUS_LABELS[r.status]}
                                                    </span>
                                                    <span className="text-xs text-[#6e6e73]">{isParcel ? "Arsa" : "Gayrimenkul"}</span>
                                                </div>
                                                {isParcel && r.parcel && (
                                                    <p className="text-sm font-medium text-[#1d1d1f]">
                                                        Ada {r.parcel.island} / Parsel {r.parcel.parsel} — {r.parcel.city}, {r.parcel.district}
                                                    </p>
                                                )}
                                                {!isParcel && r.property && (
                                                    <p className="text-sm font-medium text-[#1d1d1f]">{r.property.title} — {r.property.city}, {r.property.district}</p>
                                                )}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <User className="h-3 w-3 text-[#6e6e73]" />
                                                    <span className="text-xs text-[#6e6e73]">
                                                        {tab === "received"
                                                            ? `${r.requester.name} tarafından talep edildi`
                                                            : `${r.requester.name} (siz) tarafından gönderildi`}
                                                    </span>
                                                </div>
                                                {r.message && (
                                                    <p className="text-xs text-[#6e6e73] mt-1 italic">"{r.message}"</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {tab === "received" && r.status === "PENDING" && (
                                                <button
                                                    onClick={() => setExpanded(isOpen ? null : r.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    Yanıtla
                                                    <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                                </button>
                                            )}
                                            {r.status === "APPROVED" && (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            )}
                                            {r.status === "REJECTED" && (
                                                <XCircle className="h-5 w-5 text-red-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Yanıtlama paneli (sadece bekleyen talepler için) */}
                                {isOpen && tab === "received" && r.status === "PENDING" && form && (
                                    <div className="border-t border-black/[0.06] p-4 bg-gray-50/50">
                                        <p className="text-xs font-semibold text-[#1d1d1f] mb-3">Paylaşılacak Bilgiler</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                            {shareFields.map(field => (
                                                <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={form[field.key] as boolean}
                                                        onChange={e => updateForm(r.id, field.key, e.target.checked)}
                                                        className="w-4 h-4 rounded accent-purple-600"
                                                    />
                                                    <span className="text-sm text-[#1d1d1f]">{field.label}</span>
                                                    {field.alwaysOk && (
                                                        <span className="text-xs text-green-600">(genellikle güvenli)</span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Notunuz (opsiyonel)</label>
                                            <input
                                                type="text"
                                                value={form.ownerNote}
                                                onChange={e => updateForm(r.id, "ownerNote", e.target.value)}
                                                placeholder="Danışmana bir not bırakın..."
                                                className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDecision(r.id, "REJECTED")}
                                                disabled={approving === r.id}
                                                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reddet
                                            </button>
                                            <button
                                                onClick={() => handleDecision(r.id, "APPROVED")}
                                                disabled={approving === r.id}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Seçili Bilgilerle Onayla
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Onay sonrası özet */}
                                {r.status === "APPROVED" && (
                                    <div className="border-t border-black/[0.06] px-4 py-2 bg-green-50/50 flex flex-wrap gap-2">
                                        {shareFields.filter(f => r[f.key]).map(f => (
                                            <span key={f.key} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                {f.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import AdminRoute from "@/components/AdminRoute";
import { MapPin, Share2, UserPlus, X, Search, ChevronDown, Building2, Check, Users } from "lucide-react";
import Link from "next/link";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Share {
    id: number;
    userId: number;
    permission: string;
    user: { id: number; name: string; email: string };
}

interface Parcel {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    island: string;
    parsel: string;
    area: number | null;
    category: string;
    crmStage: string;
    owner: { id: number; name: string; email: string };
    assignee: { id: number; name: string; email: string } | null;
    shares: Share[];
}

const CATEGORY_LABELS: Record<string, string> = {
    RESIDENTIAL: "Konut", COMMERCIAL: "Ticari", MIXED_USE: "Karma",
    INDUSTRIAL: "Sanayi", AGRICULTURAL: "Tarım", TOURISM: "Turizm",
    INVESTMENT: "Yatırım", DEVELOPMENT: "Geliştirme", UNCATEGORIZED: "Kategorisiz",
};

const STAGE_LABELS: Record<string, string> = {
    NEW_LEAD: "Yeni", CONTACTED: "İletişimde", ANALYSIS: "Analiz",
    OFFER_SENT: "Teklif", CONTRACT: "Sözleşme", LOST: "Kayıp",
};

export default function AdminParcelsPage() {
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterOwner, setFilterOwner] = useState("");
    const [shareModal, setShareModal] = useState<Parcel | null>(null);
    const [shareLoading, setShareLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const [parcelsRes, usersRes] = await Promise.all([
            fetch("/api/admin/parcels"),
            fetch("/api/admin/users"),
        ]);
        if (parcelsRes.ok) setParcels(await parcelsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const filtered = parcels.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q || [p.city, p.district, p.neighborhood, p.island, p.parsel, p.owner.name]
            .some(v => v?.toLowerCase().includes(q));
        const matchOwner = !filterOwner || p.owner.id === parseInt(filterOwner);
        return matchSearch && matchOwner;
    });

    const handleShare = async (parcel: Parcel, userId: number) => {
        const alreadyShared = parcel.shares.some(s => s.userId === userId);
        setShareLoading(true);
        if (alreadyShared) {
            await fetch(`/api/parcels/${parcel.id}/share?userId=${userId}`, { method: "DELETE" });
        } else {
            await fetch(`/api/parcels/${parcel.id}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, permission: "EDIT" }),
            });
        }
        await fetchAll();
        // refresh modal parcel
        const updated = await fetch("/api/admin/parcels").then(r => r.json());
        const updatedParcel = updated.find((p: Parcel) => p.id === parcel.id);
        if (updatedParcel) setShareModal(updatedParcel);
        setShareLoading(false);
    };

    const advisors = users.filter(u => u.role !== "ADMIN");

    return (
        <AdminRoute>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-blue-600" />
                            Parsel Yönetimi
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Tüm parselleri görüntüle ve danışmanlara paylaştır</p>
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                        {filtered.length} / {parcels.length} parsel
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Şehir, ilçe, ada, parsel, sahip..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                        />
                    </div>
                    <div className="relative">
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <select
                            value={filterOwner}
                            onChange={e => setFilterOwner(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white min-w-[180px]"
                        >
                            <option value="">Tüm Sahipler</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="py-20 text-center text-gray-400">Yükleniyor...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">Parsel bulunamadı.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">Parsel</th>
                                        <th className="text-left px-4 py-3 font-semibold">Sahip</th>
                                        <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                                        <th className="text-left px-4 py-3 font-semibold">Aşama</th>
                                        <th className="text-left px-4 py-3 font-semibold">Paylaşılanlar</th>
                                        <th className="text-right px-4 py-3 font-semibold">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(parcel => (
                                        <tr key={parcel.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{parcel.city} / {parcel.district}</div>
                                                <div className="text-xs text-gray-400">{parcel.neighborhood} · Ada {parcel.island} / Parsel {parcel.parsel}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                        {parcel.owner.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-xs">{parcel.owner.name}</div>
                                                        <div className="text-[11px] text-gray-400">{parcel.owner.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                    {CATEGORY_LABELS[parcel.category] || parcel.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                                                    {STAGE_LABELS[parcel.crmStage] || parcel.crmStage}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {parcel.shares.length > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        {parcel.shares.slice(0, 3).map(s => (
                                                            <div key={s.id} title={s.user.name}
                                                                className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold border border-white">
                                                                {s.user.name.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {parcel.shares.length > 3 && (
                                                            <span className="text-xs text-gray-400">+{parcel.shares.length - 3}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setShareModal(parcel)}
                                                        className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors font-medium"
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" />
                                                        Paylaş
                                                    </button>
                                                    <Link
                                                        href={`/parcels/${parcel.id}`}
                                                        className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                                                    >
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        Detay
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {shareModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Share2 className="h-4 w-4 text-purple-600" />
                                    Parseli Paylaş
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {shareModal.city} / {shareModal.district} · Ada {shareModal.island}
                                </p>
                            </div>
                            <button onClick={() => setShareModal(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Danışmanlar</p>
                            {advisors.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Henüz danışman yok. Kullanıcı yönetiminden ekleyin.</p>
                            ) : (
                                <div className="space-y-2">
                                    {advisors.map(user => {
                                        const shared = shareModal.shares.some(s => s.userId === user.id);
                                        const isOwner = shareModal.owner.id === user.id;
                                        return (
                                            <div key={user.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${shared ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100"} ${isOwner ? "opacity-60" : ""}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${shared ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-900">{user.name}</div>
                                                        <div className="text-xs text-gray-400">{user.email}</div>
                                                    </div>
                                                </div>
                                                {isOwner ? (
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Sahip</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleShare(shareModal, user.id)}
                                                        disabled={shareLoading}
                                                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${shared
                                                            ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                                                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        {shared ? <><Check className="h-3 w-3" /> Paylaşıldı</> : <><UserPlus className="h-3 w-3" /> Paylaş</>}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="px-5 pb-5">
                            <Link
                                href="/admin/users"
                                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Users className="h-4 w-4" />
                                Kullanıcı yönetimine git
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AdminRoute>
    );
}

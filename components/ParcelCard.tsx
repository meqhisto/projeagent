"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import ConfirmDialog from "./ConfirmDialog";
import ParcelDetailModal from "./ParcelDetailModal";
import EditParcelDrawer from "./EditParcelDrawer";
import { MapPin, Calendar, Trash2, Eye, Edit2, Tag, ArrowUpRight } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    RESIDENTIAL: { label: "Konut", color: "text-blue-600", bg: "bg-blue-50/80" },
    COMMERCIAL: { label: "Ticari", color: "text-indigo-600", bg: "bg-indigo-50/80" },
    INDUSTRIAL: { label: "Sanayi", color: "text-amber-600", bg: "bg-amber-50/80" },
    AGRICULTURAL: { label: "Tarım", color: "text-emerald-600", bg: "bg-emerald-50/80" },
    MIXED_USE: { label: "Karma", color: "text-purple-600", bg: "bg-purple-50/80" },
    TOURISM: { label: "Turizm", color: "text-sky-600", bg: "bg-sky-50/80" },
    INVESTMENT: { label: "Yatırım", color: "text-amber-600", bg: "bg-amber-50/80" },
    DEVELOPMENT: { label: "Geliştirme", color: "text-rose-600", bg: "bg-rose-50/80" },
    UNCATEGORIZED: { label: "Diğer", color: "text-slate-600", bg: "bg-slate-50/80" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    COMPLETED: { label: "Tamamlandı", color: "text-emerald-600", bg: "bg-white/90" },
    RESEARCHING: { label: "Araştırılıyor", color: "text-amber-600", bg: "bg-white/90" },
    PENDING: { label: "Bekliyor", color: "text-slate-600", bg: "bg-white/90" },
    FAILED: { label: "Başarısız", color: "text-rose-600", bg: "bg-white/90" },
};

interface ParcelCardProps {
    id?: number;
    city: string;
    district: string;
    island: string | number;
    parcel: string | number;
    status: "PENDING" | "RESEARCHING" | "COMPLETED" | "FAILED";
    imageUrl?: string | null;
    zoning?: {
        ks?: number | null;
        taks?: number | null;
        maxHeight?: number | null;
    } | null;
    category?: string;
    tags?: string | null;
}

export default function ParcelCard({
    id,
    city,
    district,
    island,
    parcel,
    status,
    imageUrl,
    zoning,
    category,
}: ParcelCardProps) {
    const router = useRouter();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/parcels/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Silme işlemi başarısız');
            setIsDeleteOpen(false);
            router.refresh();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Parsel silinirken bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    };

    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const categoryConfig = CATEGORY_CONFIG[category || 'UNCATEGORIZED'];

    return (
        <>
            <div className="group relative bg-white rounded-[24px] border border-black/[0.04] shadow-sm hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-300 overflow-hidden flex flex-col h-full">
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                    <Link href={`/parcels/${id || '#'}`} className="block h-full w-full cursor-pointer">
                        {imageUrl ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-slate-50">
                                <MapPin className="h-10 w-10 text-slate-300" />
                            </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    {/* Status Badge - Floating */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className={clsx(
                            "px-3 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm border border-black/[0.04]",
                            statusConfig.bg,
                            statusConfig.color
                        )}>
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Quick Actions - Floating */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsQuickViewOpen(true); }}
                            className="p-2 rounded-full bg-white/90 text-slate-600 hover:text-blue-600 shadow-lg backdrop-blur-md transition-colors"
                            title="Hızlı Bakış"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditOpen(true); }}
                            className="p-2 rounded-full bg-white/90 text-slate-600 hover:text-blue-600 shadow-lg backdrop-blur-md transition-colors"
                            title="Düzenle"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteOpen(true); }}
                            className="p-2 rounded-full bg-white/90 text-slate-600 hover:text-rose-600 shadow-lg backdrop-blur-md transition-colors"
                            title="Sil"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 mb-1">
                                <MapPin className="h-3 w-3" />
                                {city}, {district}
                            </div>
                            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">
                                Ada {island} / Parsel {parcel}
                            </h3>
                        </div>
                    </div>

                    {/* Tags/Category */}
                    {category && category !== "UNCATEGORIZED" && (
                        <div className="mb-4">
                            <span className={clsx(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold",
                                categoryConfig.bg,
                                categoryConfig.color
                            )}>
                                <Tag className="h-3 w-3" />
                                {categoryConfig.label}
                            </span>
                        </div>
                    )}

                    {/* Zoning Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Emsal (KAKS)</div>
                            <div className="text-[15px] font-bold text-slate-900">
                                {zoning?.ks ? zoning.ks.toFixed(2) : "—"}
                            </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">TAKS</div>
                            <div className="text-[15px] font-bold text-slate-900">
                                {zoning?.taks ? zoning.taks.toFixed(2) : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Bugün
                        </span>
                        <Link
                            href={`/parcels/${id || '#'}`}
                            className="group/link flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Detayları Gör
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                        </Link>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Parseli Sil"
                message="Bu parseli silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                variant="danger"
                isLoading={isDeleting}
            />

            {id && (
                <ParcelDetailModal
                    isOpen={isQuickViewOpen}
                    onClose={() => setIsQuickViewOpen(false)}
                    parcelId={id}
                />
            )}

            {id && (
                <EditParcelDrawer
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSuccess={() => router.refresh()}
                    parcelId={id}
                />
            )}
        </>
    );
}

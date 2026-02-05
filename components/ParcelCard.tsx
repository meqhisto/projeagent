"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import ConfirmDialog from "./ConfirmDialog";
import ParcelDetailModal from "./ParcelDetailModal";
import EditParcelDrawer from "./EditParcelDrawer";
import { MapPin, ArrowRight, Calendar, Trash2, Eye, Edit2, Tag, Layers } from "lucide-react";

// Category labels and colors - Premium styling
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    RESIDENTIAL: { label: "Konut", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    COMMERCIAL: { label: "Ticari", color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
    INDUSTRIAL: { label: "Sanayi", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
    AGRICULTURAL: { label: "Tarım", color: "text-green-600", bg: "bg-green-50 border-green-100" },
    MIXED_USE: { label: "Karma", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
    TOURISM: { label: "Turizm", color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100" },
    INVESTMENT: { label: "Yatırım", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    DEVELOPMENT: { label: "Geliştirme", color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
    UNCATEGORIZED: { label: "Kategorisiz", color: "text-slate-500", bg: "bg-slate-50 border-slate-100" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    COMPLETED: { label: "Tamamlandı", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    RESEARCHING: { label: "Araştırılıyor", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    PENDING: { label: "Bekliyor", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    FAILED: { label: "Başarısız", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

interface ParcelCardProps {
    id?: number;
    city: string;
    district: string;
    island: number;
    parcel: number;
    status: "PENDING" | "RESEARCHING" | "COMPLETED" | "FAILED";
    imageUrl?: string | null;
    zoning?: {
        ks?: number;
        taks?: number;
        maxHeight?: number;
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
    tags
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
            const response = await fetch(`/api/parcels/${id}`, {
                method: 'DELETE',
            });

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
            <div className="group relative card-premium overflow-hidden flex flex-col h-full">
                {/* Image Area */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-20">
                        <span className={clsx(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border backdrop-blur-sm",
                            statusConfig.bg,
                            statusConfig.color
                        )}>
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Action Buttons (Hover Only) */}
                    <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsQuickViewOpen(true);
                            }}
                            className="p-2 rounded-lg bg-white/95 text-slate-600 hover:text-teal-600 shadow-sm hover:shadow-md transition-all backdrop-blur-sm"
                            title="Hızlı Bakış"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsEditOpen(true);
                            }}
                            className="p-2 rounded-lg bg-white/95 text-slate-600 hover:text-blue-600 shadow-sm hover:shadow-md transition-all backdrop-blur-sm"
                            title="Düzenle"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDeleteOpen(true);
                            }}
                            className="p-2 rounded-lg bg-white/95 text-slate-600 hover:text-red-600 shadow-sm hover:shadow-md transition-all backdrop-blur-sm"
                            title="Parseli Sil"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    <Link href={`/parcels/${id || '#'}`} className="block h-full w-full">
                        {imageUrl ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                                <div className="p-4 rounded-2xl bg-white shadow-sm">
                                    <MapPin className="h-8 w-8 text-slate-300" />
                                </div>
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                        {/* Location & Title */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                            <div className="flex items-center gap-1.5 text-slate-200 text-[11px] font-medium uppercase tracking-wider mb-1">
                                <MapPin className="h-3 w-3" />
                                {city}, {district}
                            </div>
                            <h3 className="font-display text-xl font-bold tracking-tight text-white drop-shadow-md truncate">
                                Ada {island} / Parsel {parcel}
                            </h3>
                        </div>
                    </Link>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                    {/* Category Badge */}
                    {category && category !== "UNCATEGORIZED" && (
                        <div className="mb-3">
                            <span className={clsx(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                categoryConfig.bg,
                                categoryConfig.color
                            )}>
                                <Tag className="h-3 w-3" />
                                {categoryConfig.label}
                            </span>
                        </div>
                    )}

                    {/* Zoning Data */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider mb-1">EMSAL</span>
                            <span className="text-lg font-display font-bold text-slate-800">
                                {zoning?.ks ? zoning.ks.toFixed(2) : "—"}
                            </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider mb-1">TAKS</span>
                            <span className="text-lg font-display font-bold text-slate-800">
                                {zoning?.taks ? zoning.taks.toFixed(2) : "—"}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            Bugün
                        </span>

                        <Link
                            href={`/parcels/${id || '#'}`}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 group/link transition-colors"
                        >
                            Detayları Gör
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import ConfirmDialog from "./ConfirmDialog";
import ParcelDetailModal from "./ParcelDetailModal";
import EditParcelDrawer from "./EditParcelDrawer";
import { MapPin, ArrowRight, Calendar, Trash2, Eye, Edit2, Tag } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    RESIDENTIAL: { label: "Konut", color: "bg-[#0071e3]/10 text-[#0071e3]" },
    COMMERCIAL: { label: "Ticari", color: "bg-[#5856d6]/10 text-[#5856d6]" },
    INDUSTRIAL: { label: "Sanayi", color: "bg-[#ff9500]/10 text-[#c93400]" },
    AGRICULTURAL: { label: "Tarım", color: "bg-[#34c759]/10 text-[#248a3d]" },
    MIXED_USE: { label: "Karma", color: "bg-[#af52de]/10 text-[#af52de]" },
    TOURISM: { label: "Turizm", color: "bg-[#5ac8fa]/10 text-[#0077ed]" },
    INVESTMENT: { label: "Yatırım", color: "bg-[#ff9500]/10 text-[#c93400]" },
    DEVELOPMENT: { label: "Geliştirme", color: "bg-[#ff2d55]/10 text-[#ff2d55]" },
    UNCATEGORIZED: { label: "Kategorisiz", color: "bg-black/[0.04] text-[#6e6e73]" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: "Tamamlandı", color: "bg-[#34c759]/10 text-[#248a3d]" },
    RESEARCHING: { label: "Araştırılıyor", color: "bg-[#ff9500]/10 text-[#c93400]" },
    PENDING: { label: "Bekliyor", color: "bg-black/[0.04] text-[#6e6e73]" },
    FAILED: { label: "Başarısız", color: "bg-[#ff3b30]/10 text-[#d70015]" },
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
            <div className="group card overflow-hidden flex flex-col h-full">
                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden bg-[#f5f5f7]">
                    {/* Status */}
                    <div className="absolute top-3 left-3 z-10">
                        <span className={clsx(
                            "px-2.5 py-1 rounded-full text-[11px] font-medium",
                            statusConfig.color
                        )}>
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsQuickViewOpen(true); }}
                            className="p-2 rounded-lg bg-white/90 text-[#6e6e73] hover:text-[#0071e3] shadow-sm transition-colors"
                            aria-label="Parsel detaylarını görüntüle"
                            title="Detaylar"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditOpen(true); }}
                            className="p-2 rounded-lg bg-white/90 text-[#6e6e73] hover:text-[#0071e3] shadow-sm transition-colors"
                            aria-label="Parseli düzenle"
                            title="Düzenle"
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteOpen(true); }}
                            className="p-2 rounded-lg bg-white/90 text-[#6e6e73] hover:text-[#ff3b30] shadow-sm transition-colors"
                            aria-label="Parseli sil"
                            title="Sil"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    <Link
                        href={`/parcels/${id || '#'}`}
                        className="block h-full w-full"
                        aria-label={`${city}, ${district} - Ada ${island} / Parsel ${parcel} detaylarına git`}
                    >
                        {imageUrl ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <MapPin className="h-10 w-10 text-[#86868b]" />
                            </div>
                        )}
                    </Link>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-[12px] text-[#6e6e73] mb-1">
                        <MapPin className="h-3 w-3" />
                        {city}, {district}
                    </div>

                    {/* Title */}
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">
                        Ada {island} / Parsel {parcel}
                    </h3>

                    {/* Category */}
                    {category && category !== "UNCATEGORIZED" && (
                        <div className="mb-3">
                            <span className={clsx(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium",
                                categoryConfig.color
                            )}>
                                <Tag className="h-3 w-3" />
                                {categoryConfig.label}
                            </span>
                        </div>
                    )}

                    {/* Zoning */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-3 rounded-xl bg-[#f5f5f7] text-center">
                            <div className="text-[10px] uppercase text-[#86868b] font-medium mb-0.5">EMSAL</div>
                            <div className="text-lg font-semibold text-[#1d1d1f]">
                                {zoning?.ks ? zoning.ks.toFixed(2) : "—"}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#f5f5f7] text-center">
                            <div className="text-[10px] uppercase text-[#86868b] font-medium mb-0.5">TAKS</div>
                            <div className="text-lg font-semibold text-[#1d1d1f]">
                                {zoning?.taks ? zoning.taks.toFixed(2) : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-3 border-t border-black/[0.04] flex items-center justify-between">
                        <span className="text-[12px] text-[#86868b] flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Bugün
                        </span>
                        <Link
                            href={`/parcels/${id || '#'}`}
                            className="text-[13px] font-medium text-[#0071e3] hover:text-[#0077ed] flex items-center gap-1 transition-colors"
                        >
                            Detaylar
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Parseli Sil"
                message="Bu parseli silmek istediğinize emin misiniz?"
                confirmText="Sil"
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

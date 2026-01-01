"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import ConfirmDialog from "./ConfirmDialog";
import ParcelDetailModal from "./ParcelDetailModal";
import { MapPin, ArrowRight, Building2, Calendar, Trash2, Eye, MoreHorizontal, Edit2 } from "lucide-react";

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
}

export default function ParcelCard({
    id,
    city,
    district,
    island,
    parcel,
    status,
    imageUrl,
    zoning
}: ParcelCardProps) {
    const router = useRouter();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

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

    return (
        <>
            <div className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
                {/* Image Area */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-20">
                        <span className={clsx(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm border",
                            status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                status === 'RESEARCHING' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                    "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                            {status === 'RESEARCHING' ? 'Araştırılıyor' : status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                        </span>
                    </div>

                    {/* Action Buttons (Hover Only) */}
                    <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-[-10px] group-hover:translate-y-0">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsQuickViewOpen(true);
                            }}
                            className="p-2 rounded-lg bg-white/90 text-slate-600 hover:text-emerald-600 shadow-sm hover:shadow-md transition-all"
                            title="Hızlı Bakış"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDeleteOpen(true);
                            }}
                            className="p-2 rounded-lg bg-white/90 text-slate-600 hover:text-red-600 shadow-sm hover:shadow-md transition-all"
                            title="Parseli Sil"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    <Link href={`/parcels/${id || '#'}`} className="block h-full w-full">
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
                        {/* Gradient for text readability */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                            <div className="flex items-center gap-1.5 text-slate-200 text-xs font-medium uppercase tracking-wide mb-0.5">
                                <MapPin className="h-3 w-3" />
                                {city}, {district}
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-sm truncate">
                                Ada {island} / Parsel {parcel}
                            </h3>
                        </div>
                    </Link>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase text-slate-400 font-semibold">EMSAL</span>
                            <span className="text-lg font-bold text-slate-700">
                                {zoning?.ks ? zoning.ks.toFixed(2) : "-"}
                            </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase text-slate-400 font-semibold">TAKS</span>
                            <span className="text-lg font-bold text-slate-700">
                                {zoning?.taks ? zoning.taks.toFixed(2) : "-"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Bugün
                        </span>

                        <Link
                            href={`/parcels/${id || '#'}`}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/link"
                        >
                            Detayları Gör
                            <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
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
        </>
    );
}

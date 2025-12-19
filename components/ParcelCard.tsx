"use client";

import ParcelDetailModal from "./ParcelDetailModal";
import { MapPin, ArrowRight, Building2, Calendar, Trash2, Eye } from "lucide-react";

// ... (interfaces remain same)
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
            router.refresh(); // Refresh server components to update list
        } catch (error) {
            console.error('Delete error:', error);
            alert('Parsel silinirken bir hata oluştu.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-500/30">
                {/* Status Badge & Actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsQuickViewOpen(true);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-full bg-white/20 text-white hover:bg-white hover:text-emerald-600 backdrop-blur-md shadow-sm border border-white/30 transition-all duration-200"
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
                        className="inline-flex items-center justify-center p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white backdrop-blur-md shadow-sm border border-red-200 dark:border-red-900 transition-all duration-200"
                        title="Parseli Sil"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <span className={clsx(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase backdrop-blur-md shadow-sm border",
                        status === 'COMPLETED' ? "bg-emerald-500/90 text-white border-emerald-400" :
                            status === 'RESEARCHING' ? "bg-amber-500/90 text-white border-amber-400 animate-pulse" :
                                "bg-slate-500/90 text-white border-slate-400"
                    )}>
                        {status === 'RESEARCHING' ? 'Araştırılıyor' : status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                </div>

                <Link href={`/parcels/${id || '#'}`}>
                    {/* Hero Image Section */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {imageUrl ? (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
                                <MapPin className="h-16 w-16 opacity-50" />
                            </div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80" />

                        {/* Bottom Info on Image */}
                        <div className="absolute bottom-4 left-4 text-white">
                            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                                <Building2 className="h-3 w-3" />
                                {city} / {district}
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight shadow-black drop-shadow-md">
                                {island} / {parcel}
                            </h3>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 font-medium">EMSAL (KAKS)</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {zoning?.ks ? zoning.ks.toFixed(2) : <span className="text-slate-400">-</span>}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 font-medium">TAKS</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {zoning?.taks ? zoning.taks.toFixed(2) : <span className="text-slate-400">-</span>}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <div className="flex items-center text-xs text-slate-400">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>14 Ara 2025</span>
                            </div>
                            <span className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                                Detaylar <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Parseli Sil"
                message={`Bu parseli (${city} / ${district} - ${island}/${parcel}) silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ilgili tüm veriler (notlar, resimler vb.) silinecektir.`}
                confirmText="Evet, Sil"
                cancelText="İptal"
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

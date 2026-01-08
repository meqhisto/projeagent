"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    HardHat, ArrowLeft, Phone, Mail, MapPin, Globe, FileText, Star,
    Plus, Calendar, Banknote, Building2, User, Edit, Check, X, Loader2
} from "lucide-react";
import ContractorMatchModal from "@/components/ContractorMatchModal";

interface Contractor {
    id: number;
    name: string;
    authorizedPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    taxNumber?: string;
    specialties?: string;
    notes?: string;
    averageScore?: number;
    ratings: Rating[];
    matches: Match[];
}

interface Rating {
    id: number;
    reliability: number;
    quality: number;
    communication: number;
    pricing: number;
    overallScore: number;
    comment?: string;
    createdAt: string;
    rater: { id: number; name: string };
}

interface Match {
    id: number;
    status: string;
    meetingDate?: string;
    offerAmount?: number;
    notes?: string;
    createdAt: string;
    parcel: { id: number; city: string; district: string; neighborhood: string; island: string; parsel: string };
    customer?: { id: number; name: string; phone?: string };
}

const statusLabels: Record<string, { label: string; color: string }> = {
    PLANNED: { label: "Görüşme Planlandı", color: "bg-blue-100 text-blue-700" },
    MET: { label: "Görüşüldü", color: "bg-purple-100 text-purple-700" },
    OFFER_RECEIVED: { label: "Teklif Alındı", color: "bg-yellow-100 text-yellow-700" },
    AGREED: { label: "Anlaşıldı", color: "bg-emerald-100 text-emerald-700" },
    REJECTED: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
};

export default function ContractorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [contractor, setContractor] = useState<Contractor | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [editing, setEditing] = useState(false);

    const fetchContractor = useCallback(async () => {
        try {
            const res = await fetch(`/api/contractors/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setContractor(data);
            } else {
                router.push("/contractors");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        fetchContractor();
    }, [fetchContractor]);

    const renderStars = (score: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        className={`h-5 w-5 ${i <= score ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                ))}
            </div>
        );
    };

    const handleUpdateMatch = async (matchId: number, status: string) => {
        try {
            await fetch(`/api/contractors/${params.id}/matches`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, status }),
            });
            fetchContractor();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!contractor) return null;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/contractors"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <HardHat className="h-8 w-8 text-orange-600" />
                        {contractor.name}
                    </h1>
                    {contractor.authorizedPerson && (
                        <p className="text-gray-500 mt-1">{contractor.authorizedPerson}</p>
                    )}
                </div>
                {contractor.averageScore && (
                    <div className="text-right">
                        <div className="flex items-center gap-1">
                            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                            <span className="text-2xl font-bold text-gray-900">
                                {contractor.averageScore.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-sm text-gray-500">{contractor.ratings.length} değerlendirme</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Info */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Contact Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">İletişim Bilgileri</h3>
                        <div className="space-y-3">
                            {contractor.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <a href={`tel:${contractor.phone}`} className="text-gray-700 hover:text-orange-600">
                                        {contractor.phone}
                                    </a>
                                </div>
                            )}
                            {contractor.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <a href={`mailto:${contractor.email}`} className="text-gray-700 hover:text-orange-600">
                                        {contractor.email}
                                    </a>
                                </div>
                            )}
                            {contractor.address && (
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">{contractor.address}</span>
                                </div>
                            )}
                            {contractor.website && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <a href={contractor.website.startsWith("http") ? contractor.website : `https://${contractor.website}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-orange-600 hover:underline">
                                        {contractor.website}
                                    </a>
                                </div>
                            )}
                            {contractor.taxNumber && (
                                <div className="flex items-center gap-3 text-sm">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">VKN: {contractor.taxNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Specialties */}
                    {contractor.specialties && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-4">Uzmanlık Alanları</h3>
                            <div className="flex flex-wrap gap-2">
                                {contractor.specialties.split(",").map((s, i) => (
                                    <span key={i} className="px-3 py-1 text-sm bg-orange-50 text-orange-700 rounded-full font-medium">
                                        {s.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {contractor.notes && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-bold text-gray-900 mb-3">Notlar</h3>
                            <p className="text-sm text-gray-600">{contractor.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Matches & Ratings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Matches Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Arsa Eşleştirmeleri</h3>
                            <button
                                onClick={() => setShowMatchModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                            >
                                <Plus className="h-4 w-4" /> Eşleştir
                            </button>
                        </div>

                        {contractor.matches.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Henüz eşleştirme yok</p>
                        ) : (
                            <div className="space-y-3">
                                {contractor.matches.map(match => (
                                    <div key={match.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <Link
                                                    href={`/parcels/${match.parcel.id}`}
                                                    className="font-medium text-gray-900 hover:text-orange-600"
                                                >
                                                    {match.parcel.city} / {match.parcel.district} - {match.parcel.island}/{match.parcel.parsel}
                                                </Link>
                                                {match.customer && (
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                                                        <User className="h-3.5 w-3.5" />
                                                        {match.customer.name}
                                                        {match.customer.phone && ` - ${match.customer.phone}`}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusLabels[match.status]?.color || "bg-gray-100 text-gray-700"}`}>
                                                {statusLabels[match.status]?.label || match.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {match.meetingDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(match.meetingDate).toLocaleDateString("tr-TR")}
                                                </div>
                                            )}
                                            {match.offerAmount && (
                                                <div className="flex items-center gap-1">
                                                    <Banknote className="h-3.5 w-3.5" />
                                                    {match.offerAmount.toLocaleString("tr-TR")} ₺
                                                </div>
                                            )}
                                        </div>
                                        {match.notes && (
                                            <p className="text-xs text-gray-400 mt-2 italic">{match.notes}</p>
                                        )}
                                        {/* Quick status update */}
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                                            {Object.entries(statusLabels).map(([key, val]) => (
                                                key !== match.status && (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleUpdateMatch(match.id, key)}
                                                        className={`px-2 py-1 text-xs rounded ${val.color} hover:opacity-80`}
                                                    >
                                                        {val.label}
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ratings Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Değerlendirmeler</h3>
                            <button
                                onClick={() => setShowRatingModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
                            >
                                <Star className="h-4 w-4" /> Puanla
                            </button>
                        </div>

                        {contractor.ratings.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Henüz değerlendirme yok</p>
                        ) : (
                            <div className="space-y-4">
                                {contractor.ratings.map(rating => (
                                    <div key={rating.id} className="border border-gray-100 rounded-xl p-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                            <div>
                                                <span className="text-xs text-gray-500">Güvenilirlik</span>
                                                {renderStars(rating.reliability)}
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Kalite</span>
                                                {renderStars(rating.quality)}
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">İletişim</span>
                                                {renderStars(rating.communication)}
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Fiyat</span>
                                                {renderStars(rating.pricing)}
                                            </div>
                                        </div>
                                        {rating.comment && (
                                            <p className="text-sm text-gray-600 italic">&quot;{rating.comment}&quot;</p>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                                            <span>{rating.rater.name}</span>
                                            <span>{new Date(rating.createdAt).toLocaleDateString("tr-TR")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showMatchModal && (
                <ContractorMatchModal
                    contractorId={contractor.id}
                    onClose={() => setShowMatchModal(false)}
                    onRefresh={fetchContractor}
                />
            )}

            {showRatingModal && (
                <RatingModal
                    contractorId={contractor.id}
                    onClose={() => setShowRatingModal(false)}
                    onRefresh={fetchContractor}
                />
            )}
        </div>
    );
}

// Rating Modal Component
function RatingModal({ contractorId, onClose, onRefresh }: { contractorId: number; onClose: () => void; onRefresh: () => void }) {
    const [loading, setLoading] = useState(false);
    const [reliability, setReliability] = useState(0);
    const [quality, setQuality] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [pricing, setPricing] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = async () => {
        if (reliability === 0 || quality === 0 || communication === 0 || pricing === 0) {
            alert("Lütfen tüm kriterleri puanlayın");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/contractors/${contractorId}/ratings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reliability, quality, communication, pricing, comment }),
            });
            if (res.ok) {
                onRefresh();
                onClose();
            }
        } catch (e) {
            alert("Hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const StarSelector = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
        <div>
            <span className="text-sm font-medium text-gray-700 mb-1 block">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(i)}
                        className="p-1 hover:scale-110 transition-transform"
                    >
                        <Star className={`h-6 w-6 ${i <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Firma Değerlendir</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <StarSelector value={reliability} onChange={setReliability} label="Güvenilirlik" />
                    <StarSelector value={quality} onChange={setQuality} label="Kalite" />
                    <StarSelector value={communication} onChange={setCommunication} label="İletişim" />
                    <StarSelector value={pricing} onChange={setPricing} label="Fiyat/Performans" />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Yorum (Opsiyonel)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none resize-none"
                            placeholder="Değerlendirmenizi yazın..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100">
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-bold hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}

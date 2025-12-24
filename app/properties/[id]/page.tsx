"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    MapPin,
    Calendar,
    Ruler,
    DoorOpen,
    Car,
    Home,
    Edit,
    Trash2,
    TrendingUp,
    Wallet,
    Users,
    FileText,
    ChevronRight,
    Plus
} from "lucide-react";
import AddPropertyModal from "@/components/AddPropertyModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
    Property,
    PropertyTypeLabels,
    PropertyStatusLabels,
    PropertyStatusColors,
    RoomTypeLabels
} from "@/types/property";

export default function PropertyDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'finances' | 'history'>('overview');

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/properties/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Gayrimenkul bulunamadı');
                }
                throw new Error('Yükleme hatası');
            }
            const data = await response.json();
            setProperty(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/properties/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Silme hatası');
            router.push('/properties');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (!value) return "-";
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pl-72 p-8">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pl-72 p-8">
                <div className="text-center py-20">
                    <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl text-white mb-2">{error || 'Gayrimenkul bulunamadı'}</h3>
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Listeye Dön
                    </Link>
                </div>
            </div>
        );
    }

    const statusStyle = PropertyStatusColors[property.status as keyof typeof PropertyStatusColors];
    const defaultImage = property.images?.find((img: any) => img.isDefault)?.url
        || property.images?.[0]?.url
        || null;

    const tabs = [
        { id: 'overview', label: 'Genel Bakış', icon: FileText },
        { id: 'units', label: `Birimler (${property.units?.length || 0})`, icon: Building2 },
        { id: 'finances', label: 'Finansal', icon: Wallet },
        { id: 'history', label: 'Değerleme', icon: TrendingUp },
    ] as const;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="pl-72 p-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Link href="/properties" className="hover:text-white transition-colors">
                        Gayrimenkul Portföyü
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white">{property.title}</span>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-6">
                        {/* Image */}
                        <div className="w-32 h-32 rounded-2xl bg-slate-800 overflow-hidden flex-shrink-0">
                            {defaultImage ? (
                                <img src={defaultImage} alt={property.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="w-12 h-12 text-slate-600" />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-white">{property.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle?.bg} ${statusStyle?.text}`}>
                                    {PropertyStatusLabels[property.status as keyof typeof PropertyStatusLabels]}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 mb-3">
                                <MapPin className="w-4 h-4" />
                                <span>{property.neighborhood}, {property.district} / {property.city}</span>
                            </div>

                            <div className="flex gap-4">
                                <span className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                                    {PropertyTypeLabels[property.type as keyof typeof PropertyTypeLabels]}
                                </span>
                                {property.roomType && (
                                    <span className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                                        {RoomTypeLabels[property.roomType as keyof typeof RoomTypeLabels]}
                                    </span>
                                )}
                                {property.grossArea && (
                                    <span className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                                        {property.grossArea} m²
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Düzenle
                        </button>
                        <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Sil
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Mevcut Değer</p>
                        <p className="text-xl font-bold text-emerald-400">
                            {formatCurrency(property.currentValue)}
                        </p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Alış Fiyatı</p>
                        <p className="text-xl font-bold text-white">
                            {formatCurrency(property.purchasePrice)}
                        </p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Aylık Kira</p>
                        <p className="text-xl font-bold text-blue-400">
                            {formatCurrency(property.monthlyRent)}
                        </p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Birim Sayısı</p>
                        <p className="text-xl font-bold text-white">
                            {property.units?.length || 0}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-emerald-400 border-b-2 border-emerald-400'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Details */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                            <h3 className="text-lg font-semibold text-white mb-4">Detaylar</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Yapım Yılı</span>
                                    <span className="text-white">{property.buildYear || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Brüt Alan</span>
                                    <span className="text-white">{property.grossArea ? `${property.grossArea} m²` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Net Alan</span>
                                    <span className="text-white">{property.netArea ? `${property.netArea} m²` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Kat</span>
                                    <span className="text-white">
                                        {property.floorNumber || '-'} / {property.totalFloors || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Isıtma</span>
                                    <span className="text-white">{property.heatingType || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Asansör</span>
                                    <span className="text-white">{property.hasElevator ? 'Var' : 'Yok'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Otopark</span>
                                    <span className="text-white">{property.hasParking ? 'Var' : 'Yok'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Linked Parcel */}
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                            <h3 className="text-lg font-semibold text-white mb-4">Bağlı Parsel</h3>
                            {property.parcel ? (
                                <Link
                                    href={`/parcels/${property.parcel.id}`}
                                    className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                        <Home className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            Ada {property.parcel.island} / Parsel {property.parcel.parsel}
                                        </p>
                                        <p className="text-slate-400 text-sm">
                                            {property.parcel.neighborhood}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                                </Link>
                            ) : (
                                <div className="text-center py-8">
                                    <Home className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">Bağlı parsel yok</p>
                                </div>
                            )}

                            {/* Notes */}
                            {property.notes && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-slate-400 mb-2">Notlar</h4>
                                    <p className="text-white text-sm bg-slate-700/30 rounded-lg p-3">
                                        {property.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'units' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Birimler</h3>
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                <Plus className="w-4 h-4" />
                                Birim Ekle
                            </button>
                        </div>

                        {property.units?.length > 0 ? (
                            <div className="space-y-3">
                                {property.units.map((unit: any) => (
                                    <div key={unit.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                                                <DoorOpen className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{unit.unitNumber}</p>
                                                <p className="text-slate-400 text-sm">
                                                    {unit.roomType ? RoomTypeLabels[unit.roomType as keyof typeof RoomTypeLabels] : '-'}
                                                    {unit.area && ` • ${unit.area} m²`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${PropertyStatusColors[unit.status as keyof typeof PropertyStatusColors]?.bg
                                                } ${PropertyStatusColors[unit.status as keyof typeof PropertyStatusColors]?.text}`}>
                                                {PropertyStatusLabels[unit.status as keyof typeof PropertyStatusLabels]}
                                            </span>
                                            {unit.monthlyRent && (
                                                <span className="text-blue-400 font-medium">
                                                    {formatCurrency(unit.monthlyRent)}/ay
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">Henüz birim eklenmemiş</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'finances' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white mb-4">Son İşlemler</h3>
                        {property.transactions?.length > 0 ? (
                            <div className="space-y-3">
                                {property.transactions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                                        <div>
                                            <p className="text-white font-medium">{tx.description || tx.type}</p>
                                            <p className="text-slate-400 text-sm">{formatDate(tx.date)}</p>
                                        </div>
                                        <span className={`font-medium ${tx.type === 'RENT_INCOME' || tx.type === 'SALE'
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                            }`}>
                                            {tx.type === 'RENT_INCOME' || tx.type === 'SALE' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">Henüz işlem kaydı yok</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white mb-4">Değerleme Geçmişi</h3>
                        {property.valuations?.length > 0 ? (
                            <div className="space-y-3">
                                {property.valuations.map((val: any) => (
                                    <div key={val.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                                        <div>
                                            <p className="text-white font-medium">{formatCurrency(val.value)}</p>
                                            <p className="text-slate-400 text-sm">
                                                {formatDate(val.date)} • {val.source || 'Manuel'}
                                            </p>
                                        </div>
                                        {val.notes && (
                                            <p className="text-slate-400 text-sm">{val.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">Henüz değerleme kaydı yok</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AddPropertyModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => {
                    fetchProperty();
                    setShowEditModal(false);
                }}
                editProperty={property}
            />

            {/* Delete Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Gayrimenkül Sil"
                message={`"${property.title}" gayrimenkulünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Sil"
                cancelText="İptal"
                variant="danger"
            />
        </div>
    );
}

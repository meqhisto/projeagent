"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    MapPin,
    DoorOpen,
    Home,
    Edit,
    Trash2,
    TrendingUp,
    Wallet,
    FileText,
    ChevronRight,
    Plus,
    FileCheck,
    ExternalLink,
    AlertCircle,
} from "lucide-react";
import AddPropertyModal from "@/components/AddPropertyModal";
import AddUnitModal from "@/components/AddUnitModal";
import AddTransactionModal from "@/components/AddTransactionModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Unit, Transaction, TransactionTypeLabels } from "@/types/property";
import {
    PropertyTypeLabels,
    PropertyStatusLabels,
    PropertyStatusColors,
    PropertyCrmStageLabels,
    PropertyCrmStageColors,
    DocTypeLabels,
    DocType,
    RoomTypeLabels,
    KONUT_TYPES,
    TICARI_TYPES,
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
    const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'finances' | 'history' | 'documents'>('overview');

    // Document states
    const [showDocModal, setShowDocModal] = useState(false);
    const [docForm, setDocForm] = useState({ docType: "OTHER" as DocType, name: "", url: "", expiryDate: "", notes: "" });
    const [savingDoc, setSavingDoc] = useState(false);

    // Unit modal states
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [editUnit, setEditUnit] = useState<Unit | null>(null);
    const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null);

    // Transaction modal states
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
    const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);

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

    const handleDeleteUnit = async () => {
        if (!deleteUnit) return;
        try {
            const response = await fetch(`/api/properties/${id}/units/${deleteUnit.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Birim silinemedi');
            fetchProperty();
            setDeleteUnit(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleCrmStageChange = async (stage: string) => {
        try {
            await fetch(`/api/properties/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crmStage: stage }),
            });
            fetchProperty();
        } catch { /* silent */ }
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingDoc(true);
        try {
            const res = await fetch(`/api/properties/${id}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(docForm),
            });
            if (res.ok) {
                setShowDocModal(false);
                setDocForm({ docType: "OTHER", name: "", url: "", expiryDate: "", notes: "" });
                fetchProperty();
            }
        } finally {
            setSavingDoc(false);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (!confirm("Bu belgeyi silmek istiyor musunuz?")) return;
        await fetch(`/api/properties/${id}/documents/${docId}`, { method: "DELETE" });
        fetchProperty();
    };

    const handleDeleteTransaction = async () => {
        if (!deleteTransaction) return;
        try {
            const response = await fetch(`/api/properties/${id}/transactions/${deleteTransaction.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('İşlem silinemedi');
            fetchProperty();
            setDeleteTransaction(null);
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
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-900 mb-2">{error || 'Gayrimenkul bulunamadı'}</h3>
                <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Listeye Dön
                </Link>
            </div>
        );
    }

    const statusStyle = PropertyStatusColors[property.status as keyof typeof PropertyStatusColors];
    const defaultImage = property.images?.find((img: any) => img.isDefault)?.url
        || property.images?.[0]?.url
        || null;

    const isKonut = KONUT_TYPES.includes(property.type);
    const isTicari = TICARI_TYPES.includes(property.type);

    const tabs = [
        { id: 'overview', label: 'Genel Bakış', icon: FileText },
        { id: 'units', label: `Birimler (${property.units?.length || 0})`, icon: Building2 },
        { id: 'finances', label: 'Finansal', icon: Wallet },
        { id: 'history', label: 'Değerleme', icon: TrendingUp },
        { id: 'documents', label: `Belgeler (${property.documents?.length || 0})`, icon: FileCheck },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/properties" className="hover:text-gray-700 transition-colors">
                    Gayrimenkul Portföyü
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">{property.title}</span>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {defaultImage ? (
                            <img src={defaultImage} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-10 h-10 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle?.bg} ${statusStyle?.text}`}>
                                {PropertyStatusLabels[property.status as keyof typeof PropertyStatusLabels]}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-500 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{property.neighborhood}, {property.district} / {property.city}</span>
                        </div>

                        <div className="flex gap-3">
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                                {PropertyTypeLabels[property.type as keyof typeof PropertyTypeLabels]}
                            </span>
                            {property.roomType && (
                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                                    {RoomTypeLabels[property.roomType as keyof typeof RoomTypeLabels]}
                                </span>
                            )}
                            {property.grossArea && (
                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                                    {property.grossArea} m²
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* CRM Stage Selector */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-500">CRM Aşaması:</span>
                    <select
                        value={property.crmStage || "LISTING"}
                        onChange={(e) => handleCrmStageChange(e.target.value)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${PropertyCrmStageColors[property.crmStage as keyof typeof PropertyCrmStageColors] || "bg-blue-50 text-blue-700 border-blue-200"}`}
                    >
                        {Object.entries(PropertyCrmStageLabels).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        Düzenle
                    </button>
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Sil
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm mb-1">Mevcut Değer</p>
                    <p className="text-xl font-bold text-[#0071e3]">
                        {formatCurrency(property.currentValue)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm mb-1">Alış Fiyatı</p>
                    <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(property.purchasePrice)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm mb-1">Aylık Kira</p>
                    <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(property.monthlyRent)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <p className="text-gray-500 text-sm mb-1">Birim Sayısı</p>
                    <p className="text-xl font-bold text-gray-900">
                        {property.units?.length || 0}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                            : 'text-gray-500 hover:text-gray-700'
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
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylar</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Yapım Yılı", value: property.buildYear },
                                { label: "Brüt Alan", value: property.grossArea ? `${property.grossArea} m²` : null },
                                { label: "Net Alan", value: property.netArea ? `${property.netArea} m²` : null },
                                { label: "Kat", value: (property.floorNumber || property.totalFloors) ? `${property.floorNumber ?? '-'} / ${property.totalFloors ?? '-'}` : null },
                                { label: "Isıtma", value: property.heatingType },
                                { label: "Asansör", value: property.hasElevator ? 'Var' : 'Yok' },
                                { label: "Otopark", value: property.hasParking ? 'Var' : 'Yok' },
                            ].map(({ label, value }) => value != null && (
                                <div key={label} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-500 text-sm">{label}</span>
                                    <span className="text-gray-900 text-sm font-medium">{String(value)}</span>
                                </div>
                            ))}

                            {/* Konut özel */}
                            {isKonut && (
                                <>
                                    {property.bathroomCount != null && (
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm">Banyo</span>
                                            <span className="text-gray-900 text-sm font-medium">{property.bathroomCount}</span>
                                        </div>
                                    )}
                                    {property.balconyCount != null && (
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm">Balkon</span>
                                            <span className="text-gray-900 text-sm font-medium">{property.balconyCount}</span>
                                        </div>
                                    )}
                                    {property.monthlyDues != null && (
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm">Aidat</span>
                                            <span className="text-gray-900 text-sm font-medium">{formatCurrency(property.monthlyDues)}/ay</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">Mobilyalı</span>
                                        <span className={`text-sm font-medium ${property.isFurnished ? 'text-green-600' : 'text-gray-500'}`}>{property.isFurnished ? 'Evet' : 'Hayır'}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">İskan Belgesi</span>
                                        <span className={`text-sm font-medium ${property.hasOccupancyCertificate ? 'text-green-600' : 'text-orange-500'}`}>{property.hasOccupancyCertificate ? 'Var' : 'Yok'}</span>
                                    </div>
                                </>
                            )}

                            {/* Ticari özel */}
                            {isTicari && (
                                <>
                                    {property.usageType && (
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm">Kullanım Türü</span>
                                            <span className="text-gray-900 text-sm font-medium">{property.usageType}</span>
                                        </div>
                                    )}
                                    {property.commonAreaRatio != null && (
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm">Ortak Alan</span>
                                            <span className="text-gray-900 text-sm font-medium">%{property.commonAreaRatio}</span>
                                        </div>
                                    )}
                                    {property.monthlyDues != null && (
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500 text-sm">Aidat</span>
                                            <span className="text-gray-900 text-sm font-medium">{formatCurrency(property.monthlyDues)}/ay</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-500 text-sm">YKİ (Yapı Kullanım İzni)</span>
                                        <span className={`text-sm font-medium ${property.hasOccupancyCertificate ? 'text-green-600' : 'text-orange-500'}`}>{property.hasOccupancyCertificate ? 'Var' : 'Yok'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Linked Parcel */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bağlı Parsel</h3>
                        {property.parcel ? (
                            <Link
                                href={`/parcels/${property.parcel.id}`}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Home className="w-6 h-6 text-[#0071e3]" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-medium">
                                        Ada {property.parcel.island} / Parsel {property.parcel.parsel}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        {property.parcel.neighborhood}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                            </Link>
                        ) : (
                            <div className="text-center py-8">
                                <Home className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">Bağlı parsel yok</p>
                            </div>
                        )}

                        {/* Notes */}
                        {property.notes && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Notlar</h4>
                                <p className="text-gray-900 text-sm bg-gray-50 rounded-lg p-3">
                                    {property.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'units' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Birimler</h3>
                        <button
                            onClick={() => { setEditUnit(null); setShowUnitModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Birim Ekle
                        </button>
                    </div>

                    {property.units?.length > 0 ? (
                        <div className="space-y-3">
                            {property.units.map((unit: any) => (
                                <div key={unit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <DoorOpen className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-medium">{unit.unitNumber}</p>
                                            <p className="text-gray-500 text-sm">
                                                {unit.roomType ? RoomTypeLabels[unit.roomType as keyof typeof RoomTypeLabels] : '-'}
                                                {unit.area && ` • ${unit.area} m²`}
                                                {unit.tenant && (
                                                    <span className="ml-2 text-[#0071e3]">• Kiracı: {unit.tenant.name}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${PropertyStatusColors[unit.status as keyof typeof PropertyStatusColors]?.bg
                                            } ${PropertyStatusColors[unit.status as keyof typeof PropertyStatusColors]?.text}`}>
                                            {PropertyStatusLabels[unit.status as keyof typeof PropertyStatusLabels]}
                                        </span>
                                        {unit.monthlyRent && (
                                            <span className="text-blue-600 font-medium">
                                                {formatCurrency(unit.monthlyRent)}/ay
                                            </span>
                                        )}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setEditUnit(unit); setShowUnitModal(true); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteUnit(unit)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-3">Henüz birim eklenmemiş</p>
                            <button
                                onClick={() => { setEditUnit(null); setShowUnitModal(true); }}
                                className="px-4 py-2 bg-emerald-100 text-[#0077ed] rounded-lg hover:bg-emerald-200 transition-colors"
                            >
                                İlk Birimi Ekle
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'finances' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Son İşlemler</h3>
                        <button
                            onClick={() => { setEditTransaction(null); setShowTransactionModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            İşlem Ekle
                        </button>
                    </div>
                    {property.transactions?.length > 0 ? (
                        <div className="space-y-3">
                            {property.transactions.map((tx: any) => {
                                const isIncome = tx.type === 'RENT_INCOME' || tx.type === 'SALE' || tx.type === 'DEPOSIT';
                                return (
                                    <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                                                <Wallet className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium">
                                                    {tx.description || TransactionTypeLabels[tx.type as keyof typeof TransactionTypeLabels]}
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    {formatDate(tx.date)}
                                                    {tx.category && ` • ${tx.category}`}
                                                    {!tx.isPaid && <span className="ml-2 text-orange-500">• Ödenmedi</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => { setEditTransaction(tx); setShowTransactionModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTransaction(tx)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-3">Henüz işlem kaydı yok</p>
                            <button
                                onClick={() => { setEditTransaction(null); setShowTransactionModal(true); }}
                                className="px-4 py-2 bg-emerald-100 text-[#0077ed] rounded-lg hover:bg-emerald-200 transition-colors"
                            >
                                İlk İşlemi Ekle
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Değerleme Geçmişi</h3>
                    {property.valuations?.length > 0 ? (
                        <div className="space-y-3">
                            {property.valuations.map((val: any) => (
                                <div key={val.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-gray-900 font-medium">{formatCurrency(val.value)}</p>
                                        <p className="text-gray-500 text-sm">
                                            {formatDate(val.date)} • {val.source || 'Manuel'}
                                        </p>
                                    </div>
                                    {val.notes && (
                                        <p className="text-gray-500 text-sm">{val.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Henüz değerleme kaydı yok</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Belgeler</h3>
                        <button
                            onClick={() => setShowDocModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Belge Ekle
                        </button>
                    </div>

                    {property.documents?.length > 0 ? (
                        <div className="space-y-3">
                            {property.documents.map((doc: any) => {
                                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                const expiringSoon = doc.expiryDate && !isExpired && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 86400000);
                                return (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired ? 'bg-red-100' : expiringSoon ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                                <FileCheck className={`w-5 h-5 ${isExpired ? 'text-red-600' : expiringSoon ? 'text-orange-600' : 'text-blue-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium text-sm">{doc.name}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {DocTypeLabels[doc.docType as DocType] || doc.docType}
                                                    {doc.expiryDate && (
                                                        <span className={`ml-2 ${isExpired ? 'text-red-500' : expiringSoon ? 'text-orange-500' : 'text-gray-400'}`}>
                                                            {isExpired ? '• Süresi dolmuş' : expiringSoon ? '• 30 gün içinde doluyor' : `• Son: ${formatDate(doc.expiryDate)}`}
                                                        </span>
                                                    )}
                                                </p>
                                                {doc.notes && <p className="text-gray-400 text-xs mt-0.5">{doc.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isExpired && <AlertCircle className="w-4 h-4 text-red-500" />}
                                            {doc.url && (
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-3">Henüz belge eklenmemiş</p>
                            <button
                                onClick={() => setShowDocModal(true)}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                İlk Belgeyi Ekle
                            </button>
                        </div>
                    )}

                    {/* Add Document Modal */}
                    {showDocModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDocModal(false)} />
                            <form onSubmit={handleAddDocument} className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Belge Ekle</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Belge Türü</label>
                                        <select
                                            value={docForm.docType}
                                            onChange={e => setDocForm(f => ({ ...f, docType: e.target.value as DocType }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                        >
                                            {Object.entries(DocTypeLabels).map(([v, l]) => (
                                                <option key={v} value={v}>{l}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Belge Adı *</label>
                                        <input
                                            required
                                            type="text"
                                            value={docForm.name}
                                            onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                            placeholder="Örn: 2024 Tapu Fotokopisi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">URL / Link (opsiyonel)</label>
                                        <input
                                            type="url"
                                            value={docForm.url}
                                            onChange={e => setDocForm(f => ({ ...f, url: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                            placeholder="https://drive.google.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Son Geçerlilik Tarihi (opsiyonel)</label>
                                        <input
                                            type="date"
                                            value={docForm.expiryDate}
                                            onChange={e => setDocForm(f => ({ ...f, expiryDate: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Not (opsiyonel)</label>
                                        <input
                                            type="text"
                                            value={docForm.notes}
                                            onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                            placeholder="Kısa not..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-5">
                                    <button type="button" onClick={() => setShowDocModal(false)}
                                        className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                                        İptal
                                    </button>
                                    <button type="submit" disabled={savingDoc}
                                        className="flex-1 px-4 py-2 text-sm bg-[#0071e3] text-white rounded-xl hover:bg-[#0077ed] disabled:opacity-50">
                                        {savingDoc ? "Kaydediliyor..." : "Kaydet"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

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

            {/* Unit Modal */}
            <AddUnitModal
                isOpen={showUnitModal}
                onClose={() => { setShowUnitModal(false); setEditUnit(null); }}
                onSuccess={() => {
                    fetchProperty();
                    setShowUnitModal(false);
                    setEditUnit(null);
                }}
                propertyId={parseInt(id)}
                editUnit={editUnit}
            />

            {/* Delete Unit Dialog */}
            <ConfirmDialog
                isOpen={!!deleteUnit}
                onClose={() => setDeleteUnit(null)}
                onConfirm={handleDeleteUnit}
                title="Birim Sil"
                message={`"${deleteUnit?.unitNumber}" birimini silmek istediğinizden emin misiniz?`}
                confirmText="Sil"
                cancelText="İptal"
                variant="danger"
            />

            {/* Transaction Modal */}
            <AddTransactionModal
                isOpen={showTransactionModal}
                onClose={() => { setShowTransactionModal(false); setEditTransaction(null); }}
                onSuccess={() => {
                    fetchProperty();
                    setShowTransactionModal(false);
                    setEditTransaction(null);
                }}
                propertyId={parseInt(id)}
                units={property.units}
                editTransaction={editTransaction}
            />

            {/* Delete Transaction Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTransaction}
                onClose={() => setDeleteTransaction(null)}
                onConfirm={handleDeleteTransaction}
                title="İşlem Sil"
                message={`Bu işlemi silmek istediğinizden emin misiniz?`}
                confirmText="Sil"
                cancelText="İptal"
                variant="danger"
            />
        </div>
    );
}

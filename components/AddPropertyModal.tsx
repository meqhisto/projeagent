"use client";

import { useState, useEffect } from "react";
import { X, Upload, MapPin, Building2, DollarSign, Settings2 } from "lucide-react";
import {
    PropertyType,
    PropertyStatus,
    RoomType,
    PropertyTypeLabels,
    PropertyStatusLabels,
    RoomTypeLabels,
    PropertyFormData
} from "@/types/property";

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editProperty?: any;
    parcels?: Array<{ id: number; island: string; parsel: string; neighborhood: string }>;
}

export default function AddPropertyModal({
    isOpen,
    onClose,
    onSuccess,
    editProperty,
    parcels = []
}: AddPropertyModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'features' | 'financial'>('basic');

    const [formData, setFormData] = useState<PropertyFormData>({
        title: "",
        type: "APARTMENT",
        status: "AVAILABLE",
        city: "",
        district: "",
        neighborhood: "",
        address: "",
        latitude: undefined,
        longitude: undefined,
        grossArea: undefined,
        netArea: undefined,
        roomType: undefined,
        floorNumber: undefined,
        totalFloors: undefined,
        buildYear: undefined,
        hasElevator: false,
        hasParking: false,
        heatingType: "",
        purchasePrice: undefined,
        purchaseDate: "",
        currentValue: undefined,
        monthlyRent: undefined,
        listingPrice: undefined,
        parcelId: undefined,
        notes: "",
    });

    useEffect(() => {
        if (editProperty) {
            setFormData({
                title: editProperty.title || "",
                type: editProperty.type || "APARTMENT",
                status: editProperty.status || "AVAILABLE",
                city: editProperty.city || "",
                district: editProperty.district || "",
                neighborhood: editProperty.neighborhood || "",
                address: editProperty.address || "",
                latitude: editProperty.latitude || undefined,
                longitude: editProperty.longitude || undefined,
                grossArea: editProperty.grossArea || undefined,
                netArea: editProperty.netArea || undefined,
                roomType: editProperty.roomType || undefined,
                floorNumber: editProperty.floorNumber || undefined,
                totalFloors: editProperty.totalFloors || undefined,
                buildYear: editProperty.buildYear || undefined,
                hasElevator: editProperty.hasElevator || false,
                hasParking: editProperty.hasParking || false,
                heatingType: editProperty.heatingType || "",
                purchasePrice: editProperty.purchasePrice || undefined,
                purchaseDate: editProperty.purchaseDate?.split('T')[0] || "",
                currentValue: editProperty.currentValue || undefined,
                monthlyRent: editProperty.monthlyRent || undefined,
                listingPrice: editProperty.listingPrice || undefined,
                parcelId: editProperty.parcelId || undefined,
                notes: editProperty.notes || "",
            });
        }
    }, [editProperty]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = editProperty
                ? `/api/properties/${editProperty.id}`
                : "/api/properties";

            const response = await fetch(url, {
                method: editProperty ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "İşlem başarısız");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof PropertyFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'basic', label: 'Temel Bilgiler', icon: Building2 },
        { id: 'location', label: 'Konum', icon: MapPin },
        { id: 'features', label: 'Özellikler', icon: Settings2 },
        { id: 'financial', label: 'Finansal', icon: DollarSign },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">
                        {editProperty ? "Gayrimenkul Düzenle" : "Yeni Gayrimenkul Ekle"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
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

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Basic Info Tab */}
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Başlık *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="Örn: Ataşehir 3+1 Daire"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Gayrimenkul Tipi</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleChange('type', e.target.value as PropertyType)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                    >
                                        {Object.entries(PropertyTypeLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Durum</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleChange('status', e.target.value as PropertyStatus)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                    >
                                        {Object.entries(PropertyStatusLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Oda Sayısı</label>
                                    <select
                                        value={formData.roomType || ""}
                                        onChange={(e) => handleChange('roomType', e.target.value || undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(RoomTypeLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Bağlı Parsel</label>
                                    <select
                                        value={formData.parcelId || ""}
                                        onChange={(e) => handleChange('parcelId', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                    >
                                        <option value="">Parsel Seçiniz (Opsiyonel)</option>
                                        {parcels.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.island}/{p.parsel} - {p.neighborhood}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Notlar</label>
                                    <textarea
                                        value={formData.notes || ""}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none resize-none"
                                        rows={3}
                                        placeholder="Ek bilgiler..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Location Tab */}
                        {activeTab === 'location' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Şehir *</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="İstanbul"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">İlçe *</label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={(e) => handleChange('district', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="Kadıköy"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Mahalle *</label>
                                    <input
                                        type="text"
                                        value={formData.neighborhood}
                                        onChange={(e) => handleChange('neighborhood', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="Caferağa"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Adres</label>
                                    <input
                                        type="text"
                                        value={formData.address || ""}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="Sokak, Bina No"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Enlem</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude || ""}
                                        onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="41.0082"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Boylam</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude || ""}
                                        onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="28.9784"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Features Tab */}
                        {activeTab === 'features' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Brüt m²</label>
                                    <input
                                        type="number"
                                        value={formData.grossArea || ""}
                                        onChange={(e) => handleChange('grossArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="120"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Net m²</label>
                                    <input
                                        type="number"
                                        value={formData.netArea || ""}
                                        onChange={(e) => handleChange('netArea', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Bulunduğu Kat</label>
                                    <input
                                        type="number"
                                        value={formData.floorNumber || ""}
                                        onChange={(e) => handleChange('floorNumber', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Toplam Kat</label>
                                    <input
                                        type="number"
                                        value={formData.totalFloors || ""}
                                        onChange={(e) => handleChange('totalFloors', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Yapım Yılı</label>
                                    <input
                                        type="number"
                                        value={formData.buildYear || ""}
                                        onChange={(e) => handleChange('buildYear', e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="2020"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Isıtma Tipi</label>
                                    <select
                                        value={formData.heatingType || ""}
                                        onChange={(e) => handleChange('heatingType', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="Doğalgaz (Kombi)">Doğalgaz (Kombi)</option>
                                        <option value="Merkezi">Merkezi</option>
                                        <option value="Klima">Klima</option>
                                        <option value="Soba">Soba</option>
                                        <option value="Yerden Isıtma">Yerden Isıtma</option>
                                    </select>
                                </div>

                                <div className="col-span-2 flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasElevator}
                                            onChange={(e) => handleChange('hasElevator', e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-[#0071e3] focus:ring-[#0071e3]"
                                        />
                                        <span className="text-slate-300">Asansör</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.hasParking}
                                            onChange={(e) => handleChange('hasParking', e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-[#0071e3] focus:ring-[#0071e3]"
                                        />
                                        <span className="text-slate-300">Otopark</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Financial Tab */}
                        {activeTab === 'financial' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Alış Fiyatı (₺)</label>
                                    <input
                                        type="number"
                                        value={formData.purchasePrice || ""}
                                        onChange={(e) => handleChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="2500000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Alış Tarihi</label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate || ""}
                                        onChange={(e) => handleChange('purchaseDate', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Mevcut Değer (₺)</label>
                                    <input
                                        type="number"
                                        value={formData.currentValue || ""}
                                        onChange={(e) => handleChange('currentValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="3000000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">İlan Fiyatı (₺)</label>
                                    <input
                                        type="number"
                                        value={formData.listingPrice || ""}
                                        onChange={(e) => handleChange('listingPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="3200000"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">Aylık Kira (₺)</label>
                                    <input
                                        type="number"
                                        value={formData.monthlyRent || ""}
                                        onChange={(e) => handleChange('monthlyRent', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-[#0071e3] focus:outline-none"
                                        placeholder="15000"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-[#0071e3] text-white rounded-lg hover:bg-[#0071e3] transition-colors disabled:opacity-50"
                        >
                            {loading ? "Kaydediliyor..." : (editProperty ? "Güncelle" : "Kaydet")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

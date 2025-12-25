"use client";

import { useState, useEffect } from "react";
import { X, Building2, User, Calendar, Home } from "lucide-react";
import {
    Unit,
    UnitFormData,
    PropertyStatus,
    RoomType,
    PropertyStatusLabels,
    RoomTypeLabels
} from "@/types/property";

interface Customer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

interface AddUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    propertyId: number;
    editUnit?: Unit | null;
}

const initialFormData: UnitFormData = {
    unitNumber: "",
    roomType: undefined,
    area: undefined,
    status: "AVAILABLE",
    floorNumber: undefined,
    monthlyRent: undefined,
    currentValue: undefined,
    tenantId: undefined,
    leaseStart: undefined,
    leaseEnd: undefined,
    notes: undefined
};

export default function AddUnitModal({
    isOpen,
    onClose,
    onSuccess,
    propertyId,
    editUnit
}: AddUnitModalProps) {
    const [formData, setFormData] = useState<UnitFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            if (editUnit) {
                setFormData({
                    unitNumber: editUnit.unitNumber,
                    roomType: editUnit.roomType ?? undefined,
                    area: editUnit.area ?? undefined,
                    status: editUnit.status,
                    floorNumber: editUnit.floorNumber ?? undefined,
                    monthlyRent: editUnit.monthlyRent ?? undefined,
                    currentValue: editUnit.currentValue ?? undefined,
                    tenantId: editUnit.tenantId ?? undefined,
                    leaseStart: editUnit.leaseStart?.split('T')[0] ?? undefined,
                    leaseEnd: editUnit.leaseEnd?.split('T')[0] ?? undefined,
                    notes: editUnit.notes ?? undefined
                });
            } else {
                setFormData(initialFormData);
            }
            setError(null);
        }
    }, [isOpen, editUnit]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/crm/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
        } catch (err) {
            console.error('Müşteriler yüklenemedi:', err);
        }
    };

    const handleChange = (field: keyof UnitFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = editUnit
                ? `/api/properties/${propertyId}/units/${editUnit.id}`
                : `/api/properties/${propertyId}/units`;

            const response = await fetch(url, {
                method: editUnit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Bir hata oluştu');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editUnit ? 'Birim Düzenle' : 'Yeni Birim Ekle'}
                            </h2>
                            <p className="text-sm text-gray-500">Daire veya ofis bilgilerini girin</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Birim No <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.unitNumber}
                                onChange={(e) => handleChange('unitNumber', e.target.value)}
                                placeholder="Örn: A-12, Daire 5"
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Durum
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value as PropertyStatus)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
                            >
                                {Object.entries(PropertyStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Room & Area */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Oda Tipi
                            </label>
                            <select
                                value={formData.roomType || ""}
                                onChange={(e) => handleChange('roomType', e.target.value || undefined)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">Seçiniz</option>
                                {Object.entries(RoomTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                m²
                            </label>
                            <input
                                type="number"
                                value={formData.area || ""}
                                onChange={(e) => handleChange('area', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="100"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kat
                            </label>
                            <input
                                type="number"
                                value={formData.floorNumber || ""}
                                onChange={(e) => handleChange('floorNumber', e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="3"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Financial */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Aylık Kira (₺)
                            </label>
                            <input
                                type="number"
                                value={formData.monthlyRent || ""}
                                onChange={(e) => handleChange('monthlyRent', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="15000"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Değer (₺)
                            </label>
                            <input
                                type="number"
                                value={formData.currentValue || ""}
                                onChange={(e) => handleChange('currentValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                                placeholder="2500000"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Tenant */}
                    <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <User className="w-4 h-4" />
                            Kiracı Bilgileri
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kiracı Seç
                            </label>
                            <select
                                value={formData.tenantId || ""}
                                onChange={(e) => handleChange('tenantId', e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none bg-white"
                            >
                                <option value="">Kiracı yok</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} {customer.phone && `(${customer.phone})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.tenantId && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kira Başlangıç
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.leaseStart || ""}
                                        onChange={(e) => handleChange('leaseStart', e.target.value || undefined)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kira Bitiş
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.leaseEnd || ""}
                                        onChange={(e) => handleChange('leaseEnd', e.target.value || undefined)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notlar
                        </label>
                        <textarea
                            value={formData.notes || ""}
                            onChange={(e) => handleChange('notes', e.target.value || undefined)}
                            rows={3}
                            placeholder="Birim hakkında ek notlar..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Home className="w-4 h-4" />
                                {editUnit ? 'Güncelle' : 'Ekle'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

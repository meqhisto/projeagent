"use client";

import { useState, useEffect } from "react";
import { X, Wallet, Receipt } from "lucide-react";
import {
    Transaction,
    TransactionFormData,
    TransactionType,
    TransactionTypeLabels,
    Unit
} from "@/types/property";

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    propertyId: number;
    units?: Unit[];
    editTransaction?: Transaction | null;
}

const transactionCategories: Record<TransactionType, string[]> = {
    RENT_INCOME: ["Kira", "Depozito İadesi"],
    EXPENSE: ["Aidat", "Fatura", "Temizlik", "Güvenlik", "Diğer"],
    PURCHASE: ["Satın Alma"],
    SALE: ["Satış"],
    DEPOSIT: ["Depozito Alındı", "Depozito Verildi"],
    MAINTENANCE: ["Tadilat", "Tamirat", "Boya", "Elektrik", "Tesisat"],
    TAX: ["Emlak Vergisi", "Gelir Vergisi", "KDV"],
    INSURANCE: ["Konut Sigortası", "DASK"]
};

const initialFormData: TransactionFormData = {
    type: "RENT_INCOME",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: "",
    category: "",
    unitId: undefined,
    isPaid: true,
    dueDate: undefined
};

export default function AddTransactionModal({
    isOpen,
    onClose,
    onSuccess,
    propertyId,
    units = [],
    editTransaction
}: AddTransactionModalProps) {
    const [formData, setFormData] = useState<TransactionFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editTransaction) {
                setFormData({
                    type: editTransaction.type,
                    amount: editTransaction.amount,
                    date: new Date(editTransaction.date).toISOString().split('T')[0],
                    description: editTransaction.description ?? "",
                    category: editTransaction.category ?? "",
                    unitId: editTransaction.unitId ?? undefined,
                    isPaid: editTransaction.isPaid,
                    dueDate: editTransaction.dueDate
                        ? new Date(editTransaction.dueDate).toISOString().split('T')[0]
                        : undefined
                });
            } else {
                setFormData(initialFormData);
            }
            setError(null);
        }
    }, [isOpen, editTransaction]);

    const handleChange = (field: keyof TransactionFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = editTransaction
                ? `/api/properties/${propertyId}/transactions/${editTransaction.id}`
                : `/api/properties/${propertyId}/transactions`;

            const response = await fetch(url, {
                method: editTransaction ? 'PATCH' : 'POST',
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

    const isIncome = formData.type === 'RENT_INCOME' || formData.type === 'SALE' || formData.type === 'DEPOSIT';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <Wallet className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editTransaction ? 'İşlem Düzenle' : 'Yeni İşlem Ekle'}
                            </h2>
                            <p className="text-sm text-gray-500">Gelir veya gider kaydı</p>
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
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            İşlem Tipi <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => {
                                handleChange('type', e.target.value as TransactionType);
                                handleChange('category', '');
                            }}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
                        >
                            {Object.entries(TransactionTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tutar (₺) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.amount || ""}
                                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                                placeholder="15000"
                                required
                                min={0}
                                step={0.01}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#0071e3] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tarih <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Category & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori
                            </label>
                            <select
                                value={formData.category || ""}
                                onChange={(e) => handleChange('category', e.target.value || undefined)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
                            >
                                <option value="">Seçiniz</option>
                                {transactionCategories[formData.type]?.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        {units.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Birim
                                </label>
                                <select
                                    value={formData.unitId || ""}
                                    onChange={(e) => handleChange('unitId', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
                                >
                                    <option value="">Tüm Gayrimenkul</option>
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.unitNumber}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Açıklama
                        </label>
                        <input
                            type="text"
                            value={formData.description || ""}
                            onChange={(e) => handleChange('description', e.target.value || undefined)}
                            placeholder="İşlem hakkında not..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#0071e3] focus:outline-none"
                        />
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Receipt className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-gray-900 font-medium">Ödeme Durumu</p>
                                <p className="text-gray-500 text-sm">Bu işlem tamamlandı mı?</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isPaid}
                                onChange={(e) => handleChange('isPaid', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071e3]"></div>
                        </label>
                    </div>

                    {/* Due Date (when not paid) */}
                    {!formData.isPaid && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vade Tarihi
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate || ""}
                                onChange={(e) => handleChange('dueDate', e.target.value || undefined)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
                            />
                        </div>
                    )}
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
                        className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${isIncome
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Wallet className="w-4 h-4" />
                                {editTransaction ? 'Güncelle' : 'Kaydet'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

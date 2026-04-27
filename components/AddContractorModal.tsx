"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
    onClose: () => void;
    onRefresh: () => void;
}

export default function AddContractorModal({ onClose, onRefresh }: Props) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            const res = await fetch("/api/contractors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get("name"),
                    authorizedPerson: formData.get("authorizedPerson"),
                    phone: formData.get("phone"),
                    email: formData.get("email"),
                    address: formData.get("address"),
                    website: formData.get("website"),
                    taxNumber: formData.get("taxNumber"),
                    specialties: formData.get("specialties"),
                    notes: formData.get("notes"),
                }),
            });

            if (res.ok) {
                onRefresh();
                onClose();
            } else {
                alert("Hata oluştu");
            }
        } catch (e) {
            alert("Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Yeni Firma Ekle</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Firma Adı */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800">
                            Firma Adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="name"
                            required
                            className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="ABC İnşaat Ltd. Şti."
                        />
                    </div>

                    {/* Yetkili Kişi */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Yetkili Kişi</label>
                        <input
                            name="authorizedPerson"
                            className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="Ahmet Yılmaz"
                        />
                    </div>

                    {/* Telefon & Email */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Telefon</label>
                            <input
                                name="phone"
                                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                placeholder="05XX XXX XX XX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800">E-Posta</label>
                            <input
                                name="email"
                                type="email"
                                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                placeholder="info@firma.com"
                            />
                        </div>
                    </div>

                    {/* Adres */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Adres</label>
                        <input
                            name="address"
                            className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="İstanbul, Türkiye"
                        />
                    </div>

                    {/* Website & Vergi No */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Web Sitesi</label>
                            <input
                                name="website"
                                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                placeholder="www.firma.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800">Vergi No</label>
                            <input
                                name="taxNumber"
                                className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                placeholder="123456789"
                            />
                        </div>
                    </div>

                    {/* Uzmanlık Alanları */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Uzmanlık Alanları</label>
                        <input
                            name="specialties"
                            className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="Konut, Ticari, Villa (virgülle ayırın)"
                        />
                        <p className="text-xs text-gray-400 mt-1">Birden fazla alan için virgülle ayırın</p>
                    </div>

                    {/* Notlar */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Notlar</label>
                        <textarea
                            name="notes"
                            rows={3}
                            className="w-full mt-1 p-2.5 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                            placeholder="Firma hakkında notlar..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

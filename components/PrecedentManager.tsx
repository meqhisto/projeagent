"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, RefreshCw, Save } from "lucide-react";

interface Precedent {
    id: number;
    title: string;
    price: number;
    area: number | null;
    pricePerM2: number | null;
    sourceUrl: string | null;
    source: string | null;
    notes: string | null;
}

interface PrecedentManagerProps {
    parcelId: number;
}

export default function PrecedentManager({ parcelId }: PrecedentManagerProps) {
    const [precedents, setPrecedents] = useState<Precedent[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    // Form state
    const [newPrecedent, setNewPrecedent] = useState({
        title: "",
        price: "",
        area: "",
        sourceUrl: "",
        notes: ""
    });

    useEffect(() => {
        fetchPrecedents();
    }, [parcelId]);

    const fetchPrecedents = async () => {
        try {
            const res = await fetch(`/api/parcels/${parcelId}/precedents`);
            if (res.ok) {
                const data = await res.json();
                setPrecedents(data);
            }
        } catch (error) {
            console.error("Fetch precedents error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newPrecedent.title || !newPrecedent.price) return;

        setAdding(true);
        try {
            const res = await fetch(`/api/parcels/${parcelId}/precedents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPrecedent)
            });

            if (res.ok) {
                const added = await res.json();
                setPrecedents([added, ...precedents]);
                setNewPrecedent({
                    title: "",
                    price: "",
                    area: "",
                    sourceUrl: "",
                    notes: ""
                });
            }
        } catch (error) {
            console.error("Add precedent error:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu emsal kaydını silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/parcels/${parcelId}/precedents?precedentId=${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setPrecedents(precedents.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Delete precedent error:", error);
        }
    };

    // İstatistikler
    const averagePricePerM2 = precedents.length > 0
        ? precedents.reduce((acc, curr) => acc + (curr.pricePerM2 || 0), 0) / precedents.filter(p => p.pricePerM2).length
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Bölge Emsalleri</h3>
                    <p className="text-sm text-gray-500">
                        Bölgedeki benzer gayrimenkul satış fiyatlarını referans olarak ekleyin.
                    </p>
                </div>
                {averagePricePerM2 > 0 && (
                    <div className="bg-purple-50 px-4 py-2 rounded-lg border border-purple-100">
                        <div className="text-xs text-purple-600 uppercase font-bold">Ortalama m² Fiyatı</div>
                        <div className="text-lg font-bold text-purple-900">
                            {averagePricePerM2.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </div>
                    </div>
                )}
            </div>

            {/* Ekleme Formu */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Yeni Emsal Ekle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Başlık (Örn: Yan parseldeki satılık arsa)"
                        className="p-2 border rounded-lg"
                        value={newPrecedent.title}
                        onChange={e => setNewPrecedent({ ...newPrecedent, title: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            placeholder="Fiyat (TL)"
                            className="p-2 border rounded-lg"
                            value={newPrecedent.price}
                            onChange={e => setNewPrecedent({ ...newPrecedent, price: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Alan (m²)"
                            className="p-2 border rounded-lg"
                            value={newPrecedent.area}
                            onChange={e => setNewPrecedent({ ...newPrecedent, area: e.target.value })}
                        />
                    </div>
                    <input
                        type="url"
                        placeholder="İlan Linki (Sahibinden.com vb.)"
                        className="p-2 border rounded-lg"
                        value={newPrecedent.sourceUrl}
                        onChange={e => setNewPrecedent({ ...newPrecedent, sourceUrl: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Notlar"
                        className="p-2 border rounded-lg"
                        value={newPrecedent.notes}
                        onChange={e => setNewPrecedent({ ...newPrecedent, notes: e.target.value })}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={handleAdd}
                        disabled={adding || !newPrecedent.title || !newPrecedent.price}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                        {adding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Emsal Ekle
                    </button>
                </div>
            </div>

            {/* Liste */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : precedents.length === 0 ? (
                <div className="text-center py-8 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500">
                    Henüz emsal veri eklenmemiş.
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-3">Başlık</th>
                                <th className="p-3">Fiyat</th>
                                <th className="p-3">Alan</th>
                                <th className="p-3">m² Fiyatı</th>
                                <th className="p-3">Link</th>
                                <th className="p-3 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {precedents.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-900">{p.title}</td>
                                    <td className="p-3">{p.price.toLocaleString('tr-TR')} ₺</td>
                                    <td className="p-3">{p.area ? `${p.area} m²` : '-'}</td>
                                    <td className="p-3 font-bold text-gray-900">
                                        {p.pricePerM2 ? `${Math.round(p.pricePerM2).toLocaleString('tr-TR')} ₺` : '-'}
                                    </td>
                                    <td className="p-3">
                                        {p.sourceUrl && (
                                            <a
                                                href={p.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                İlan
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

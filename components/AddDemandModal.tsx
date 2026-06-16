"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ClipboardList } from "lucide-react";

interface Customer {
    id: number;
    name: string;
}

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

const PARCEL_CATEGORIES = [
    { value: "RESIDENTIAL", label: "Konut Arsası" },
    { value: "COMMERCIAL", label: "Ticari Arsa" },
    { value: "INDUSTRIAL", label: "Sanayi Arsası" },
    { value: "AGRICULTURAL", label: "Tarım Arazisi" },
    { value: "MIXED_USE", label: "Karma Kullanım" },
    { value: "TOURISM", label: "Turizm Arsası" },
    { value: "INVESTMENT", label: "Yatırım Amaçlı" },
    { value: "DEVELOPMENT", label: "Geliştirme Arazisi" },
];

const PROPERTY_TYPES = [
    { value: "APARTMENT", label: "Daire" },
    { value: "VILLA", label: "Villa" },
    { value: "DETACHED", label: "Müstakil Ev" },
    { value: "OFFICE", label: "Ofis" },
    { value: "SHOP", label: "Dükkan" },
    { value: "COMMERCIAL", label: "Ticari Alan" },
    { value: "LAND", label: "Arsa" },
    { value: "BUILDING", label: "Bina" },
    { value: "WAREHOUSE", label: "Depo" },
];

const ROOM_TYPES = [
    "STUDIO", "ONE_PLUS_ZERO", "ONE_PLUS_ONE", "TWO_PLUS_ONE",
    "THREE_PLUS_ONE", "THREE_PLUS_TWO", "FOUR_PLUS_ONE", "FOUR_PLUS_TWO",
    "FIVE_PLUS_ONE", "FIVE_PLUS_TWO", "SIX_PLUS",
];

const ROOM_LABELS: Record<string, string> = {
    STUDIO: "Stüdyo", ONE_PLUS_ZERO: "1+0", ONE_PLUS_ONE: "1+1", TWO_PLUS_ONE: "2+1",
    THREE_PLUS_ONE: "3+1", THREE_PLUS_TWO: "3+2", FOUR_PLUS_ONE: "4+1", FOUR_PLUS_TWO: "4+2",
    FIVE_PLUS_ONE: "5+1", FIVE_PLUS_TWO: "5+2", SIX_PLUS: "6+",
};

export default function AddDemandModal({ onClose, onSaved }: Props) {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [type, setType] = useState<"PARCEL" | "PROPERTY" | "BOTH">("BOTH");
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/crm/customers").then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => null);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const form = e.target as HTMLFormElement;
        const fd = new FormData(form);
        const get = (k: string) => fd.get(k) as string | null;
        const getNum = (k: string) => { const v = get(k); return v ? parseFloat(v) : null; };
        const getBool = (k: string) => { const v = get(k); return v === "" || v === null ? null : v === "true"; };

        const body: Record<string, unknown> = {
            title: get("title"),
            type,
            customerId: get("customerId") ? Number(get("customerId")) : null,
            city: get("city") || null,
            district: get("district") || null,
            neighborhood: get("neighborhood") || null,
            minArea: getNum("minArea"),
            maxArea: getNum("maxArea"),
            minPrice: getNum("minPrice"),
            maxPrice: getNum("maxPrice"),
            notes: get("notes") || null,
            deadline: get("deadline") ? new Date(get("deadline")!).toISOString() : null,
        };

        if (type === "PARCEL" || type === "BOTH") {
            body.parcelCategory = get("parcelCategory") || null;
            body.minKAKS = getNum("minKAKS");
            body.maxKAKS = getNum("maxKAKS");
            body.zoningType = get("zoningType") || null;
        }

        if (type === "PROPERTY" || type === "BOTH") {
            body.propertyType = get("propertyType") || null;
            body.roomType = get("roomType") || null;
            body.hasElevator = getBool("hasElevator");
            body.hasParking = getBool("hasParking");
        }

        try {
            const res = await fetch("/api/demands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                onSaved();
            } else {
                const data = await res.json();
                setError(data.error || "Talep oluşturulamadı");
            }
        } catch {
            setError("Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-purple-600" />
                        <h2 className="text-base font-semibold text-[#1d1d1f]">Yeni Talep</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-black/[0.04] rounded-lg transition-colors">
                        <X className="h-4 w-4 text-[#6e6e73]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Başlık */}
                    <div>
                        <label className="block text-xs font-medium text-[#6e6e73] mb-1">Başlık *</label>
                        <input name="title" required placeholder="Ör: Kadıköy'de 1000m² arsa arıyorum" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                    </div>

                    {/* Talep Tipi */}
                    <div>
                        <label className="block text-xs font-medium text-[#6e6e73] mb-2">Talep Tipi *</label>
                        <div className="flex gap-2">
                            {(["BOTH", "PARCEL", "PROPERTY"] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-2 text-sm rounded-xl border transition-all ${type === t ? "border-purple-500 bg-purple-50 text-purple-700 font-medium" : "border-black/10 text-[#6e6e73] hover:border-black/20"}`}
                                >
                                    {t === "BOTH" ? "Her İkisi" : t === "PARCEL" ? "Arsa" : "Gayrimenkul"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Müşteri */}
                    <div>
                        <label className="block text-xs font-medium text-[#6e6e73] mb-1">Müşteri (opsiyonel)</label>
                        <select name="customerId" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30 bg-white">
                            <option value="">Seçin...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Konum */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Şehir</label>
                            <input name="city" placeholder="İstanbul" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">İlçe</label>
                            <input name="district" placeholder="Kadıköy" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Mahalle</label>
                            <input name="neighborhood" placeholder="Moda" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                    </div>

                    {/* Alan & Fiyat */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Min Alan (m²)</label>
                            <input name="minArea" type="number" min="0" placeholder="500" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Max Alan (m²)</label>
                            <input name="maxArea" type="number" min="0" placeholder="2000" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Min Fiyat (₺)</label>
                            <input name="minPrice" type="number" min="0" placeholder="1000000" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Max Fiyat (₺)</label>
                            <input name="maxPrice" type="number" min="0" placeholder="10000000" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                    </div>

                    {/* Arsa kriterleri */}
                    {(type === "PARCEL" || type === "BOTH") && (
                        <div className="border border-black/[0.06] rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-[#1d1d1f]">Arsa Kriterleri</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Kategori</label>
                                    <select name="parcelCategory" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none bg-white">
                                        <option value="">Fark etmez</option>
                                        {PARCEL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">İmar Türü</label>
                                    <input name="zoningType" placeholder="Konut, Ticaret..." className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Min KAKS</label>
                                    <input name="minKAKS" type="number" step="0.1" min="0" placeholder="1.5" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Max KAKS</label>
                                    <input name="maxKAKS" type="number" step="0.1" min="0" placeholder="3.0" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gayrimenkul kriterleri */}
                    {(type === "PROPERTY" || type === "BOTH") && (
                        <div className="border border-black/[0.06] rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-[#1d1d1f]">Gayrimenkul Kriterleri</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Gayrimenkul Tipi</label>
                                    <select name="propertyType" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none bg-white">
                                        <option value="">Fark etmez</option>
                                        {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Oda Tipi</label>
                                    <select name="roomType" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none bg-white">
                                        <option value="">Fark etmez</option>
                                        {ROOM_TYPES.map(r => <option key={r} value={r}>{ROOM_LABELS[r]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Asansör</label>
                                    <select name="hasElevator" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none bg-white">
                                        <option value="">Fark etmez</option>
                                        <option value="true">Olsun</option>
                                        <option value="false">Olmasın</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#6e6e73] mb-1">Otopark</label>
                                    <select name="hasParking" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none bg-white">
                                        <option value="">Fark etmez</option>
                                        <option value="true">Olsun</option>
                                        <option value="false">Olmasın</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Son Tarih + Notlar */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Son Tarih</label>
                            <input name="deadline" type="date" className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6e6e73] mb-1">Notlar</label>
                        <textarea name="notes" rows={2} placeholder="Ek talepler, tercihler..." className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30 resize-none" />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-black/10 rounded-xl hover:bg-black/[0.02] transition-colors">
                            İptal
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 py-2.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Talep Oluştur
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

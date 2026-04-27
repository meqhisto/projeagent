"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Search, MapPin, User } from "lucide-react";

interface Props {
    contractorId: number;
    onClose: () => void;
    onRefresh: () => void;
}

interface Parcel {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    island: string;
    parsel: string;
}

interface Customer {
    id: number;
    name: string;
    role: string;
    phone?: string;
}

export default function ContractorMatchModal({ contractorId, onClose, onRefresh }: Props) {
    const [loading, setLoading] = useState(false);
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [parcelSearch, setParcelSearch] = useState("");
    const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [status, setStatus] = useState("PLANNED");
    const [meetingDate, setMeetingDate] = useState("");
    const [offerAmount, setOfferAmount] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetchParcels();
        fetchCustomers();
    }, []);

    const fetchParcels = async () => {
        try {
            const res = await fetch("/api/parcels");
            if (res.ok) {
                const data = await res.json();
                setParcels(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/crm/customers");
            if (res.ok) {
                const data = await res.json();
                // Sadece arsa sahiplerini filtrele
                setCustomers(data.filter((c: Customer) => c.role === "Land Owner"));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredParcels = parcels.filter(p => {
        const searchStr = `${p.city} ${p.district} ${p.neighborhood} ${p.island} ${p.parsel}`.toLowerCase();
        return searchStr.includes(parcelSearch.toLowerCase());
    });

    const handleSubmit = async () => {
        if (!selectedParcel) {
            alert("Lütfen bir parsel seçin");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/contractors/${contractorId}/matches`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    parcelId: selectedParcel.id,
                    customerId: selectedCustomer?.id || null,
                    status,
                    meetingDate: meetingDate || null,
                    offerAmount: offerAmount ? parseFloat(offerAmount) : null,
                    notes: notes || null,
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
                    <h3 className="text-xl font-bold text-gray-900">Arsa Eşleştir</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Parcel Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Parsel Seç <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={parcelSearch}
                                onChange={(e) => setParcelSearch(e.target.value)}
                                placeholder="Parsel ara..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        {selectedParcel && (
                            <div className="mt-2 p-2 bg-orange-50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-orange-600" />
                                    <span className="font-medium text-orange-800">
                                        {selectedParcel.city}/{selectedParcel.district} - {selectedParcel.island}/{selectedParcel.parsel}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedParcel(null)}
                                    className="text-orange-600 hover:text-orange-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {!selectedParcel && parcelSearch && (
                            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                {filteredParcels.slice(0, 5).map(parcel => (
                                    <button
                                        key={parcel.id}
                                        onClick={() => {
                                            setSelectedParcel(parcel);
                                            setParcelSearch("");
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                    >
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {parcel.city}/{parcel.district} - {parcel.island}/{parcel.parsel}
                                    </button>
                                ))}
                                {filteredParcels.length === 0 && (
                                    <p className="p-3 text-sm text-gray-400 text-center">Sonuç bulunamadı</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Customer (Land Owner) Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Arsa Sahibi (Opsiyonel)
                        </label>
                        {selectedCustomer ? (
                            <div className="p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">
                                        {selectedCustomer.name} {selectedCustomer.phone && `- ${selectedCustomer.phone}`}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <select
                                onChange={(e) => {
                                    const customer = customers.find(c => c.id === parseInt(e.target.value));
                                    setSelectedCustomer(customer || null);
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            >
                                <option value="">Seçiniz...</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} {customer.phone && `- ${customer.phone}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Durum</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                        >
                            <option value="PLANNED">Görüşme Planlandı</option>
                            <option value="MET">Görüşüldü</option>
                            <option value="OFFER_RECEIVED">Teklif Alındı</option>
                            <option value="AGREED">Anlaşıldı</option>
                            <option value="REJECTED">Reddedildi</option>
                        </select>
                    </div>

                    {/* Meeting Date & Offer */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Görüşme Tarihi</label>
                            <input
                                type="date"
                                value={meetingDate}
                                onChange={(e) => setMeetingDate(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Teklif Tutarı (₺)</label>
                            <input
                                type="number"
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                placeholder="0"
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Notlar</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Görüşme notları..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedParcel}
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Eşleştir
                    </button>
                </div>
            </div>
        </div>
    );
}

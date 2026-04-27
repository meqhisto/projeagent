"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Loader2, User, Check, X } from "lucide-react";

interface AddStakeholderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    parcelId: number;
    existingStakeholderIds: number[];
}

export default function AddStakeholderModal({ isOpen, onClose, onSuccess, parcelId, existingStakeholderIds }: AddStakeholderModalProps) {
    const [mode, setMode] = useState<"SEARCH" | "CREATE">("SEARCH");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

    // Create Form State
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        role: "Land Owner",
        phone: "",
        email: "",
        notes: ""
    });

    // Debounced search
    useEffect(() => {
        if (mode === "SEARCH") {
            const timer = setTimeout(() => {
                if (searchTerm.length >= 2) {
                    handleSearch();
                } else {
                    setSearchResults([]);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, mode]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/customers?search=${searchTerm}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out already connected customers
                setSearchResults(data.filter((c: any) => !existingStakeholderIds.includes(c.id)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const connectCustomer = async (customerId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/customers/${customerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectParcelId: parcelId })
            });
            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
            alert("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const createCustomer = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newCustomer, parcelId })
            });
            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
            alert("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        Kişi Ekle / Bağla
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                        <button
                            onClick={() => setMode("SEARCH")}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "SEARCH" ? "bg-white shadow-sm text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Mevcut Kişi Ara
                        </button>
                        <button
                            onClick={() => setMode("CREATE")}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === "CREATE" ? "bg-white shadow-sm text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Yeni Kişi Oluştur
                        </button>
                    </div>

                    {mode === "SEARCH" ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    placeholder="İsim, telefon veya e-posta ile ara..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(customer => (
                                        <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{customer.name}</div>
                                                <div className="text-xs text-gray-500 flex gap-2">
                                                    <span>{customer.role === "Land Owner" ? "Mal Sahibi" : customer.role}</span>
                                                    {customer.phone && <span>• {customer.phone}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => connectCustomer(customer.id)}
                                                className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-[#0071e3]/10 hover:text-[#0077ed] hover:border-emerald-200 transition-colors"
                                            >
                                                Seç ve Ekle
                                            </button>
                                        </div>
                                    ))
                                ) : searchTerm.length >= 2 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">Sonuç bulunamadı.</div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-xs">Arama yapmak için en az 2 karakter girin.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Ad Soyad</label>
                                <input className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                    value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Rol</label>
                                <select className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                    value={newCustomer.role} onChange={e => setNewCustomer({ ...newCustomer, role: e.target.value })}
                                >
                                    <option value="Land Owner">Mal Sahibi</option>
                                    <option value="Investor">Yatırımcı</option>
                                    <option value="Agent">Emlakçı</option>
                                    <option value="Architect">Mimar</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Telefon</label>
                                    <input className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                        value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">E-Posta</label>
                                    <input className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                        value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={createCustomer}
                                disabled={!newCustomer.name || loading}
                                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Yeni Kişiyi Kaydet"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

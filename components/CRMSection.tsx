"use client";

import { useState, useEffect } from "react";
import { Users, Phone, Calendar, Plus, UserPlus, Mail, FileText, User } from "lucide-react";

interface Interaction {
    id: number;
    type: string;
    content: string;
    date: string;
    customer?: {
        name: string;
        role: string;
    };
}

interface Customer {
    id: number;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    notes?: string;
}

export default function CRMSection({ parcelId }: { parcelId: number }) {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [interactionType, setInteractionType] = useState("CALL");
    const [content, setContent] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

    // New Customer Form
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        role: "Land Owner",
        phone: "",
        email: "",
        notes: ""
    });

    useEffect(() => {
        fetchData();
    }, [parcelId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [intRes, custRes] = await Promise.all([
                fetch(`/api/crm/interactions?parcelId=${parcelId}`),
                fetch(`/api/crm/customers?parcelId=${parcelId}`)
            ]);

            if (intRes.ok) setInteractions(await intRes.json());
            if (custRes.ok) setCustomers(await custRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async () => {
        if (!newCustomer.name) return;
        try {
            const res = await fetch(`/api/crm/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newCustomer, parcelId })
            });
            if (res.ok) {
                const customer = await res.json();
                setCustomers([customer, ...customers]);
                setSelectedCustomerId(customer.id.toString());
                setShowNewCustomer(false);
                setNewCustomer({ name: "", role: "Land Owner", phone: "", email: "", notes: "" });
            }
        } catch (e) {
            alert("Müşteri oluşturulamadı.");
        }
    };

    const handleAddInteraction = async () => {
        if (!content) return;
        try {
            const res = await fetch(`/api/crm/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parcelId,
                    type: interactionType,
                    content,
                    customerId: selectedCustomerId ? parseInt(selectedCustomerId) : null
                })
            });

            if (res.ok) {
                fetchData(); // Refresh list
                setShowAddForm(false);
                setContent("");
                setInteractionType("CALL");
            }
        } catch (e) {
            alert("Etkileşim eklenemedi.");
        }
    };

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-purple-600" />
                    İlişki Yönetimi (CRM)
                </h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-100 flex items-center transition-colors shadow-sm border border-emerald-100"
                >
                    <Plus className="h-4 w-4 mr-1" /> Kayıt/Kişi Ekle
                </button>
            </div>

            {/* Stakeholders List (New!) */}
            <div className="mb-8">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 pl-1">Projeyle İlgili Kişiler</h4>
                {customers.length === 0 ? (
                    <div className="text-sm text-gray-400 italic pl-1">Henüz kişi eklenmemiş.</div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {customers.map(c => (
                            <div key={c.id} className="group relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all min-w-[200px] flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm
                                    ${c.role === 'Land Owner' ? 'bg-indigo-500' : c.role === 'Investor' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 text-sm truncate">{c.name}</div>
                                    <div className="text-xs text-purple-600 font-medium">{c.role === 'Land Owner' ? 'Mal Sahibi' : c.role === 'Agent' ? 'Emlakçı' : c.role}</div>

                                    {(c.phone || c.email) && (
                                        <div className="mt-2 space-y-0.5 pt-2 border-t border-gray-100">
                                            {c.phone && <div className="flex items-center text-[11px] text-gray-500"><Phone className="w-3 h-3 mr-1 opacity-50" /> {c.phone}</div>}
                                            {c.email && <div className="flex items-center text-[11px] text-gray-500"><Mail className="w-3 h-3 mr-1 opacity-50" /> {c.email}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Interaction Form */}
            {showAddForm && (
                <div className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-200 shadow-inner animate-fade-in-down">
                    <div className="space-y-5">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Col: Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Etkileşim Türü</label>
                                <div className="flex flex-wrap gap-2">
                                    {["CALL", "MEETING", "OFFER", "NOTE"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setInteractionType(type)}
                                            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-all text-center whitespace-nowrap ${interactionType === type
                                                ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200"
                                                : "bg-white border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600"
                                                }`}
                                        >
                                            {type === "CALL" ? "Telefon" : type === "MEETING" ? "Toplantı" : type === "OFFER" ? "Teklif" : "Not"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Col: Customer */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">İlgili Kişi</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedCustomerId}
                                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                                        className="flex-1 text-sm p-2 rounded-lg border border-gray-300 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none h-[42px]"
                                    >
                                        <option value="">Kişi Seçiniz...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowNewCustomer(!showNewCustomer)}
                                        className={`w-[42px] h-[42px] flex items-center justify-center rounded-lg border transition-colors ${showNewCustomer ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                        title="Yeni Kişi Ekle"
                                    >
                                        <UserPlus className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inline New Customer Form (Enhanced) */}
                        {showNewCustomer && (
                            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                <h5 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" /> Yeni Kişi Oluştur
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input
                                        placeholder="Ad Soyad *"
                                        className="text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    />
                                    <select
                                        className="text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white"
                                        value={newCustomer.role}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, role: e.target.value })}
                                    >
                                        <option value="Land Owner">Mal Sahibi</option>
                                        <option value="Investor">Yatırımcı</option>
                                        <option value="Agent">Emlakçı</option>
                                        <option value="Architect">Mimar</option>
                                        <option value="Municipality">Belediye Yetkilisi</option>
                                    </select>
                                    <input
                                        placeholder="Telefon (5xx...)"
                                        className="text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    />
                                    <input
                                        placeholder="E-Posta"
                                        className="text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        value={newCustomer.email}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowNewCustomer(false)}
                                        className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-2"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleCreateCustomer}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 shadow-sm"
                                    >
                                        Kişiyi Kaydet
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <textarea
                                placeholder="Görüşme notları, teklif detayları..."
                                className="w-full text-sm p-4 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none min-h-[100px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <div className="absolute bottom-3 right-3">
                                <button
                                    onClick={handleAddInteraction}
                                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    İşleme Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="space-y-6 pl-2">
                {loading ? (
                    <div className="text-center text-sm text-gray-500 py-8">Yükleniyor...</div>
                ) : interactions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-900 font-medium">Henüz bir etkileşim yok</p>
                        <p className="text-xs text-gray-500 mt-1">İlk notunuzu veya görüşmenizi ekleyin.</p>
                    </div>
                ) : (
                    interactions.map((interaction) => (
                        <div key={interaction.id} className="relative flex gap-4 group">
                            {/* Timeline Line */}
                            <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-200 group-last:hidden"></div>

                            <div className="flex flex-col items-center z-10">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-white ${interaction.type === 'OFFER' ? 'bg-amber-100 text-amber-700' :
                                    interaction.type === 'MEETING' ? 'bg-blue-100 text-blue-700' :
                                        interaction.type === 'CALL' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {interaction.type === 'CALL' ? <Phone className="h-4 w-4" /> :
                                        interaction.type === 'MEETING' ? <Users className="h-4 w-4" /> :
                                            interaction.type === 'OFFER' ? '₺' : <FileText className="h-4 w-4" />}
                                </div>
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {interaction.type === 'CALL' ? 'Telefon Görüşmesi' :
                                                interaction.type === 'MEETING' ? 'Toplantı' :
                                                    interaction.type === 'OFFER' ? 'Teklif Verildi' : 'Not Alındı'}
                                        </span>
                                        {interaction.customer && (
                                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-100 flex items-center gap-1">
                                                <User className="w-3 h-3" /> {interaction.customer.name}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                                        {new Date(interaction.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm leading-relaxed">
                                    {interaction.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

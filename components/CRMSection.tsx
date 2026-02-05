"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Phone, Calendar, Plus, UserPlus, Mail, FileText, User, X } from "lucide-react";
import AddStakeholderModal from "./AddStakeholderModal";

// ... (interfaces remain same)
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
    const [isStakeholderModalOpen, setIsStakeholderModalOpen] = useState(false);

    // Form State
    const [interactionType, setInteractionType] = useState("CALL");
    const [content, setContent] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

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
            </div>

            {/* Stakeholders List */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide pl-1">Projeyle İlgili Kişiler</h4>
                    <button
                        onClick={() => setIsStakeholderModalOpen(true)}
                        className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 flex items-center transition-colors border border-purple-100"
                    >
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Kişi Ekle
                    </button>
                </div>

                {customers.length === 0 ? (
                    <div className="text-sm text-gray-400 italic pl-1 border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50">
                        Henüz bu parsele bağlı bir kişi yok.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {customers.map(c => (
                            <Link
                                key={c.id}
                                href={`/customers/${c.id}`}
                                className="group relative bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all min-w-[200px] flex items-start gap-3 cursor-pointer"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm
                                    ${c.role === 'Land Owner' ? 'bg-indigo-500' : c.role === 'Investor' ? 'bg-[#0071e3]' : 'bg-gray-400'}`}>
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 text-sm truncate group-hover:text-[#0071e3] transition-colors">{c.name}</div>
                                    <div className="text-xs text-purple-600 font-medium">{c.role === 'Land Owner' ? 'Mal Sahibi' : c.role === 'Agent' ? 'Emlakçı' : c.role}</div>

                                    {(c.phone || c.email) && (
                                        <div className="mt-2 space-y-0.5 pt-2 border-t border-gray-100">
                                            {c.phone && <div className="flex items-center text-[11px] text-gray-500"><Phone className="w-3 h-3 mr-1 opacity-50" /> {c.phone}</div>}
                                            {c.email && <div className="flex items-center text-[11px] text-gray-500"><Mail className="w-3 h-3 mr-1 opacity-50" /> {c.email}</div>}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Interaction Button Toggle */}
            {!showAddForm && (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all flex items-center justify-center gap-2 mb-8"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Etkileşim / Not Ekle
                </button>
            )}

            {/* Add Interaction Form */}
            {showAddForm && (
                <div className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-200 shadow-inner animate-fade-in-down">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-700 text-sm">Yeni Etkileşim</h4>
                        <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
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
                                <select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-gray-300 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none h-[42px]"
                                >
                                    <option value="">(Opsiyonel) Kişi Seçiniz...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

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
                                    className="bg-[#0071e3] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#0077ed] shadow-md transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Kaydet
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
                                        interaction.type === 'CALL' ? 'bg-emerald-100 text-[#0077ed]' :
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

            <AddStakeholderModal
                isOpen={isStakeholderModalOpen}
                onClose={() => setIsStakeholderModalOpen(false)}
                onSuccess={fetchData}
                parcelId={parcelId}
                existingStakeholderIds={customers.map(c => c.id)}
            />
        </div>
    );
}

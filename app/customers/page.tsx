"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, Plus, Phone, Mail, User, Briefcase, Filter } from "lucide-react";

interface Customer {
    id: number;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    notes?: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/crm/customers");
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu kişiyi silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/crm/customers/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchCustomers();
            }
        } catch (e) {
            alert("Silme başarısız");
        }
    };

    const roles = ["ALL", "Land Owner", "Investor", "Agent", "Other"];

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "ALL" || c.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case "Land Owner": return "bg-blue-100 text-blue-700";
            case "Investor": return "bg-purple-100 text-purple-700";
            case "Agent": return "bg-orange-100 text-orange-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] lg:h-[calc(100vh-theme(spacing.20))] flex flex-col space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-lg lg:text-2xl font-bold text-gray-900 flex items-center gap-2 lg:gap-3">
                        <Users className="h-5 w-5 lg:h-8 lg:w-8 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">Kişi Rehberi</span>
                    </h1>
                    <p className="text-gray-500 text-xs lg:text-sm mt-1 truncate">
                        Mal sahipleri, yatırımcılar ve paydaş yönetimi
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center justify-center px-3 lg:px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 hover:shadow-lg transition-all flex-shrink-0"
                >
                    <Plus className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Yeni Kişi</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 lg:p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                {/* Search */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="İsim, telefon veya e-posta ara..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {/* Role filter buttons - scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {roles.map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${roleFilter === role
                                ? "bg-slate-800 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {role === "ALL" ? "Tümü" : role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 overflow-y-auto pb-6 flex-1">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 text-xl font-bold">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleColor(customer.role)}`}>
                                {customer.role}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{customer.name}</h3>

                        <div className="space-y-2 mt-4 text-sm text-gray-600">
                            {customer.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {customer.phone}
                                </div>
                            )}
                            {customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{customer.email}</span>
                                </div>
                            )}
                            {(customer as any).parcels && (customer as any).parcels.length > 0 && (
                                <div className="flex items-center gap-2 text-purple-600 font-medium">
                                    <Briefcase className="h-4 w-4" />
                                    {(customer as any).parcels.length} Parsel                                </div>
                            )}
                        </div>

                        {customer.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 italic">
                                "{customer.notes}"
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between gap-2">
                            <button
                                onClick={() => setEditingCustomer(customer)}
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                Düzenle
                            </button>
                            <button
                                onClick={() => handleDelete(customer.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                ))}

                {filteredCustomers.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        Kayıt bulunamadı.
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} onRefresh={fetchCustomers} />}
            {editingCustomer && (
                <EditCustomerModal
                    customer={editingCustomer}
                    onClose={() => setEditingCustomer(null)}
                    onRefresh={fetchCustomers}
                />
            )}
        </div>
    );
}

function AddCustomerModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
    const [loading, setLoading] = useState(false);

    // Simple form handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            await fetch("/api/crm/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get("name"),
                    role: formData.get("role"),
                    phone: formData.get("phone"),
                    email: formData.get("email"),
                    notes: formData.get("notes")
                })
            });
            onRefresh();
            onClose();
        } catch (e) {
            alert("Hata");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Yeni Kişi Ekle</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800">İsim Soyisim</label>
                        <input name="name" required className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ad Soyad" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Rol</label>
                        <select name="role" className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none">
                            <option value="Land Owner">Mal Sahibi</option>
                            <option value="Investor">Yatırımcı</option>
                            <option value="Agent">Emlakçı</option>
                            <option value="Other">Diğer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Telefon</label>
                        <input name="phone" className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="05XX..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">E-Posta</label>
                        <input name="email" className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="email@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Notlar</label>
                        <textarea name="notes" className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" rows={3} placeholder="Notlar..." />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100">İptal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditCustomerModal({ customer, onClose, onRefresh }: { customer: Customer, onClose: () => void, onRefresh: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            await fetch(`/api/crm/customers/${customer.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get("name"),
                    role: formData.get("role"),
                    phone: formData.get("phone"),
                    email: formData.get("email"),
                    notes: formData.get("notes")
                })
            });
            onRefresh();
            onClose();
        } catch (e) {
            alert("Güncelleme başarısız");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Kişiyi Düzenle</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800">İsim Soyisim</label>
                        <input name="name" required defaultValue={customer.name} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ad Soyad" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Rol</label>
                        <select name="role" defaultValue={customer.role} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none">
                            <option value="Land Owner">Mal Sahibi</option>
                            <option value="Investor">Yatırımcı</option>
                            <option value="Agent">Emlakçı</option>
                            <option value="Other">Diğer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Telefon</label>
                        <input name="phone" defaultValue={customer.phone || ""} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="05XX..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">E-Posta</label>
                        <input name="email" defaultValue={customer.email || ""} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="email@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-800">Notlar</label>
                        <textarea name="notes" defaultValue={customer.notes || ""} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" rows={3} placeholder="Notlar..." />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-100">İptal</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">Güncelle</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

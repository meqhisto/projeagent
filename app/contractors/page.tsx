"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HardHat, Search, Plus, Phone, Mail, MapPin, Star, Building2, Filter, ChevronRight } from "lucide-react";
import AddContractorModal from "@/components/AddContractorModal";

interface Contractor {
    id: number;
    name: string;
    authorizedPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    specialties?: string;
    notes?: string;
    averageScore?: number;
    ratings: any[];
    matches: any[];
}

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchContractors();
    }, []);

    const fetchContractors = async () => {
        try {
            const res = await fetch("/api/contractors");
            if (res.ok) {
                const data = await res.json();
                setContractors(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/contractors/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchContractors();
            }
        } catch (e) {
            alert("Silme başarısız");
        }
    };

    const filteredContractors = contractors.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.authorizedPerson?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.specialties?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const renderStars = (score: number | undefined) => {
        if (!score) return <span className="text-gray-400 text-xs">Henüz puan yok</span>;
        const fullStars = Math.floor(score);
        const hasHalf = score - fullStars >= 0.5;
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < fullStars
                            ? "text-yellow-400 fill-yellow-400"
                            : i === fullStars && hasHalf
                                ? "text-yellow-400 fill-yellow-400/50"
                                : "text-gray-300"
                            }`}
                    />
                ))}
                <span className="text-sm text-gray-600 ml-1">({score.toFixed(1)})</span>
            </div>
        );
    };

    const getSpecialtiesList = (specialties?: string) => {
        if (!specialties) return [];
        return specialties.split(",").map(s => s.trim()).filter(Boolean);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071e3]"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] lg:h-[calc(100vh-theme(spacing.20))] flex flex-col space-y-4 lg:space-y-6 w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-lg lg:text-2xl font-bold text-gray-900 flex items-center gap-2 lg:gap-3">
                        <HardHat className="h-5 w-5 lg:h-8 lg:w-8 text-orange-600 flex-shrink-0" />
                        <span className="truncate">İnşaat Firmaları</span>
                    </h1>
                    <p className="text-gray-500 text-xs lg:text-sm mt-1 truncate">
                        Firma yönetimi, puanlama ve arsa eşleştirmesi
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center justify-center px-3 lg:px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 hover:shadow-lg transition-all flex-shrink-0"
                >
                    <Plus className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Yeni Firma</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-3 lg:p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Firma adı, yetkili, telefon veya uzmanlık ara..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 overflow-y-auto pb-6 flex-1">
                {filteredContractors.map(contractor => (
                    <div key={contractor.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-orange-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {renderStars(contractor.averageScore)}
                                <span className="text-xs text-gray-400">{contractor.ratings.length} değerlendirme</span>
                            </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{contractor.name}</h3>
                        {contractor.authorizedPerson && (
                            <p className="text-sm text-gray-500 mb-3">{contractor.authorizedPerson}</p>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                            {contractor.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {contractor.phone}
                                </div>
                            )}
                            {contractor.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{contractor.email}</span>
                                </div>
                            )}
                            {contractor.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{contractor.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Specialties */}
                        {contractor.specialties && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {getSpecialtiesList(contractor.specialties).slice(0, 3).map((spec, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded-full"
                                    >
                                        {spec}
                                    </span>
                                ))}
                                {getSpecialtiesList(contractor.specialties).length > 3 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                        +{getSpecialtiesList(contractor.specialties).length - 3}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Matches count */}
                        {contractor.matches.length > 0 && (
                            <div className="text-xs text-purple-600 font-medium mb-3">
                                {contractor.matches.length} arsa eşleşmesi
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-4 border-t border-gray-50 flex justify-between gap-2">
                            <Link
                                href={`/contractors/${contractor.id}`}
                                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                                Detay <ChevronRight className="h-4 w-4" />
                            </Link>
                            <button
                                onClick={() => handleDelete(contractor.id)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                ))}

                {filteredContractors.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        {contractors.length === 0 ? (
                            <div className="space-y-3">
                                <HardHat className="h-12 w-12 mx-auto text-gray-300" />
                                <p>Henüz firma eklenmemiş</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="text-orange-600 font-medium hover:underline"
                                >
                                    İlk firmayı ekle
                                </button>
                            </div>
                        ) : (
                            "Kayıt bulunamadı."
                        )}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <AddContractorModal
                    onClose={() => setShowAddModal(false)}
                    onRefresh={fetchContractors}
                />
            )}
        </div>
    );
}

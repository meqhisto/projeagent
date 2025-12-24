"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    Building2,
    Grid,
    List,
    SlidersHorizontal,
    X
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import AddPropertyModal from "@/components/AddPropertyModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
    Property,
    PropertyType,
    PropertyStatus,
    RoomType,
    PropertyTypeLabels,
    PropertyStatusLabels,
    RoomTypeLabels
} from "@/types/property";

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parcels, setParcels] = useState<any[]>([]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editProperty, setEditProperty] = useState<Property | null>(null);
    const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: "" as PropertyType | "",
        status: "" as PropertyStatus | "",
        roomType: "" as RoomType | "",
        city: "",
    });

    // View mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchProperties();
        fetchParcels();
    }, []);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.status) params.append('status', filters.status);
            if (filters.roomType) params.append('roomType', filters.roomType);
            if (filters.city) params.append('city', filters.city);

            const response = await fetch(`/api/properties?${params.toString()}`);
            if (!response.ok) throw new Error('Gayrimenkuller yüklenemedi');
            const data = await response.json();
            setProperties(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchParcels = async () => {
        try {
            const response = await fetch('/api/parcels');
            if (response.ok) {
                const data = await response.json();
                setParcels(data.map((p: any) => ({
                    id: p.id,
                    island: p.island,
                    parsel: p.parsel,
                    neighborhood: p.neighborhood,
                })));
            }
        } catch (err) {
            console.error('Parseller yüklenemedi:', err);
        }
    };

    const handleDelete = async () => {
        if (!deleteProperty) return;

        try {
            const response = await fetch(`/api/properties/${deleteProperty.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Silme işlemi başarısız');
            }

            fetchProperties();
            setDeleteProperty(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const filteredProperties = properties.filter(property => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                property.title.toLowerCase().includes(query) ||
                property.city.toLowerCase().includes(query) ||
                property.district.toLowerCase().includes(query) ||
                property.neighborhood.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const clearFilters = () => {
        setFilters({ type: "", status: "", roomType: "", city: "" });
        setSearchQuery("");
    };

    const hasActiveFilters = filters.type || filters.status || filters.roomType || filters.city || searchQuery;

    // Statistics
    const stats = {
        total: properties.length,
        available: properties.filter(p => p.status === 'AVAILABLE').length,
        rented: properties.filter(p => p.status === 'RENTED').length,
        totalValue: properties.reduce((sum, p) => sum + (p.currentValue || 0), 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="pl-72 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Gayrimenkul Portföyü
                        </h1>
                        <p className="text-slate-400">
                            Portföyünüzdeki tüm gayrimenkulleri yönetin
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Gayrimenkul
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Toplam</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Boş/Satılık</p>
                        <p className="text-2xl font-bold text-green-400">{stats.available}</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Kirada</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.rented}</p>
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
                        <p className="text-slate-400 text-sm mb-1">Toplam Değer</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            {new Intl.NumberFormat('tr-TR', {
                                style: 'currency',
                                currency: 'TRY',
                                maximumFractionDigits: 0,
                                notation: 'compact'
                            }).format(stats.totalValue)}
                        </p>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Gayrimenkul ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${showFilters || hasActiveFilters
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'
                            }`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        Filtreler
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                    </button>

                    <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-medium">Filtreler</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" />
                                    Temizle
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <select
                                value={filters.type}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, type: e.target.value as PropertyType | "" }));
                                    setTimeout(fetchProperties, 100);
                                }}
                                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">Tüm Tipler</option>
                                {Object.entries(PropertyTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, status: e.target.value as PropertyStatus | "" }));
                                    setTimeout(fetchProperties, 100);
                                }}
                                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">Tüm Durumlar</option>
                                {Object.entries(PropertyStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>

                            <select
                                value={filters.roomType}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, roomType: e.target.value as RoomType | "" }));
                                    setTimeout(fetchProperties, 100);
                                }}
                                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">Tüm Oda Sayıları</option>
                                {Object.entries(RoomTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Şehir"
                                value={filters.city}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, city: e.target.value }));
                                }}
                                onBlur={fetchProperties}
                                className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={fetchProperties}
                            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">
                            {hasActiveFilters ? 'Sonuç Bulunamadı' : 'Henüz Gayrimenkul Yok'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {hasActiveFilters
                                ? 'Filtre kriterlerinize uygun gayrimenkul bulunamadı.'
                                : 'Portföyünüze ilk gayrimenkulü ekleyerek başlayın.'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Filtreleri Temizle
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                            >
                                Gayrimenkul Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'flex flex-col gap-4'
                    }>
                        {filteredProperties.map(property => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                onEdit={(p) => {
                                    setEditProperty(p);
                                    setShowAddModal(true);
                                }}
                                onDelete={(p) => setDeleteProperty(p)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <AddPropertyModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditProperty(null);
                }}
                onSuccess={() => {
                    fetchProperties();
                    setEditProperty(null);
                }}
                editProperty={editProperty}
                parcels={parcels}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteProperty}
                onClose={() => setDeleteProperty(null)}
                onConfirm={handleDelete}
                title="Gayrimenkül Sil"
                message={`"${deleteProperty?.title}" gayrimenkulünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Sil"
                cancelText="İptal"
                variant="danger"
            />
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Building2,
    Grid,
    List,
    SlidersHorizontal,
    X,
    TrendingUp,
    TrendingDown,
    Wallet,
    Home,
    Users
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

    // Portfolio stats
    const [portfolioStats, setPortfolioStats] = useState<any>(null);

    useEffect(() => {
        fetchProperties();
        fetchParcels();
        fetchStats();
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

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/properties/stats');
            if (response.ok) {
                const data = await response.json();
                setPortfolioStats(data);
            }
        } catch (err) {
            console.error('İstatistikler yüklenemedi:', err);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gayrimenkul Portföyü</h1>
                    <p className="text-sm text-gray-500 mt-1">Portföyünüzdeki tüm gayrimenkulleri yönetin</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Gayrimenkul
                </button>
            </div>

            {/* Stats Cards - Enhanced */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Toplam</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Boş/Satılık</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Kirada</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.rented}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-[#0071e3]/10 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#0071e3]" />
                        </div>
                        <p className="text-gray-500 text-sm">Toplam Değer</p>
                    </div>
                    <p className="text-2xl font-bold text-[#0071e3]">
                        {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            maximumFractionDigits: 0,
                            notation: 'compact'
                        }).format(stats.totalValue)}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${(portfolioStats?.valueAppreciation || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                            {(portfolioStats?.valueAppreciation || 0) >= 0
                                ? <TrendingUp className="w-5 h-5 text-green-600" />
                                : <TrendingDown className="w-5 h-5 text-red-600" />
                            }
                        </div>
                        <p className="text-gray-500 text-sm">Değer Artışı</p>
                    </div>
                    <p className={`text-2xl font-bold ${(portfolioStats?.valueAppreciation || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(portfolioStats?.valueAppreciation || 0) >= 0 ? '+' : ''}{portfolioStats?.valueAppreciation?.toFixed(1) || 0}%
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-gray-500 text-sm">Doluluk</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                        {portfolioStats?.occupancyRate?.toFixed(0) || 0}%
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Gayrimenkul ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] focus:outline-none"
                    />
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${showFilters || hasActiveFilters
                        ? 'bg-[#0071e3]/10 border-emerald-200 text-[#0077ed]'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    Filtreler
                    {hasActiveFilters && (
                        <span className="w-2 h-2 bg-[#0071e3] rounded-full" />
                    )}
                </button>

                <div className="flex gap-1 p-1 bg-white rounded-lg border border-gray-200">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-emerald-100 text-[#0077ed]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-emerald-100 text-[#0077ed]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-gray-900 font-medium">Filtreler</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
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
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
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
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#0071e3] focus:outline-none"
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
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#0071e3] focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchProperties}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Tekrar Dene
                    </button>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {hasActiveFilters ? 'Sonuç Bulunamadı' : 'Henüz Gayrimenkul Yok'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {hasActiveFilters
                            ? 'Filtre kriterlerinize uygun gayrimenkul bulunamadı.'
                            : 'Portföyünüze ilk gayrimenkulü ekleyerek başlayın.'
                        }
                    </p>
                    {hasActiveFilters ? (
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Filtreleri Temizle
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed]"
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

"use client";

import {
    Building2,
    MapPin,
    Ruler,
    Calendar,
    DoorOpen,
    Car,
    Home,
    Edit,
    Trash2,
    Eye
} from "lucide-react";
import Link from "next/link";
import {
    Property,
    PropertyTypeLabels,
    PropertyStatusLabels,
    PropertyStatusColors,
    RoomTypeLabels
} from "@/types/property";

interface PropertyCardProps {
    property: Property;
    onEdit?: (property: Property) => void;
    onDelete?: (property: Property) => void;
}

export default function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
    const statusStyle = PropertyStatusColors[property.status];

    const formatCurrency = (value: number | null | undefined) => {
        if (!value) return "-";
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(value);
    };

    const defaultImage = property.images?.find(img => img.isDefault)?.url
        || property.images?.[0]?.url
        || null;

    return (
        <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Image Section */}
            <div className="relative h-44 bg-gray-100">
                {defaultImage ? (
                    <img
                        src={defaultImage}
                        alt={property.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Building2 className="w-14 h-14 text-gray-300" />
                    </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {PropertyStatusLabels[property.status]}
                </div>

                {/* Type Badge */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 shadow-sm">
                    {PropertyTypeLabels[property.type]}
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <Link
                        href={`/properties/${property.id}`}
                        title="Detaylar"
                        aria-label="Detaylar"
                        className="p-2 bg-white/90 rounded-lg hover:bg-[#0071e3] hover:text-white text-gray-600 transition-colors shadow-sm focus-visible:opacity-100"
                    >
                        <Eye className="w-4 h-4" />
                    </Link>
                    {onEdit && (
                        <button
                            type="button"
                            title="Düzenle"
                            aria-label="Düzenle"
                            onClick={() => onEdit(property)}
                            className="p-2 bg-white/90 rounded-lg hover:bg-blue-500 hover:text-white text-gray-600 transition-colors shadow-sm focus-visible:opacity-100"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            title="Sil"
                            aria-label="Sil"
                            onClick={() => onDelete(property)}
                            className="p-2 bg-white/90 rounded-lg hover:bg-red-500 hover:text-white text-gray-600 transition-colors shadow-sm focus-visible:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* Title */}
                <Link href={`/properties/${property.id}`}>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 hover:text-[#0071e3] transition-colors line-clamp-1">
                        {property.title}
                    </h3>
                </Link>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                        {property.neighborhood}, {property.district} / {property.city}
                    </span>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {property.roomType && (
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <DoorOpen className="w-4 h-4 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600">{RoomTypeLabels[property.roomType]}</span>
                        </div>
                    )}
                    {property.grossArea && (
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <Ruler className="w-4 h-4 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600">{property.grossArea} m²</span>
                        </div>
                    )}
                    {property.buildYear && (
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600">{property.buildYear}</span>
                        </div>
                    )}
                </div>

                {/* Amenities */}
                <div className="flex gap-2 mb-3">
                    {property.hasElevator && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            Asansör
                        </span>
                    )}
                    {property.hasParking && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1">
                            <Car className="w-3 h-3" /> Otopark
                        </span>
                    )}
                </div>

                {/* Price Section */}
                <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                    {property.currentValue && (
                        <div>
                            <p className="text-xs text-gray-400">Değer</p>
                            <p className="text-base font-bold text-[#0071e3]">
                                {formatCurrency(property.currentValue)}
                            </p>
                        </div>
                    )}
                    {property.monthlyRent && (
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Aylık Kira</p>
                            <p className="text-sm font-medium text-blue-600">
                                {formatCurrency(property.monthlyRent)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Linked Parcel */}
                {property.parcel && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <Link
                            href={`/parcels/${property.parcel.id}`}
                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#0071e3] transition-colors"
                        >
                            <Home className="w-3 h-3" />
                            <span>Parsel: {property.parcel.island}/{property.parcel.parsel}</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

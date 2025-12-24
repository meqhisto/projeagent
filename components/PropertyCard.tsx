"use client";

import {
    Building2,
    MapPin,
    Ruler,
    Calendar,
    DoorOpen,
    Car,
    Thermometer,
    TrendingUp,
    Home,
    MoreVertical,
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
        <div className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800">
                {defaultImage ? (
                    <img
                        src={defaultImage}
                        alt={property.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Building2 className="w-16 h-16 text-slate-600" />
                    </div>
                )}

                {/* Status Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {PropertyStatusLabels[property.status]}
                </div>

                {/* Type Badge */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 text-slate-300">
                    {PropertyTypeLabels[property.type]}
                </div>

                {/* Quick Actions */}
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/properties/${property.id}`}
                        className="p-2 bg-slate-900/80 rounded-lg hover:bg-emerald-500 transition-colors"
                    >
                        <Eye className="w-4 h-4 text-white" />
                    </Link>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(property)}
                            className="p-2 bg-slate-900/80 rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            <Edit className="w-4 h-4 text-white" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(property)}
                            className="p-2 bg-slate-900/80 rounded-lg hover:bg-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title */}
                <Link href={`/properties/${property.id}`}>
                    <h3 className="text-lg font-semibold text-white mb-2 hover:text-emerald-400 transition-colors line-clamp-1">
                        {property.title}
                    </h3>
                </Link>

                {/* Location */}
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">
                        {property.neighborhood}, {property.district} / {property.city}
                    </span>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {property.roomType && (
                        <div className="flex flex-col items-center p-2 bg-slate-700/30 rounded-lg">
                            <DoorOpen className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-xs text-slate-300">{RoomTypeLabels[property.roomType]}</span>
                        </div>
                    )}
                    {property.grossArea && (
                        <div className="flex flex-col items-center p-2 bg-slate-700/30 rounded-lg">
                            <Ruler className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-xs text-slate-300">{property.grossArea} m²</span>
                        </div>
                    )}
                    {property.buildYear && (
                        <div className="flex flex-col items-center p-2 bg-slate-700/30 rounded-lg">
                            <Calendar className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-xs text-slate-300">{property.buildYear}</span>
                        </div>
                    )}
                </div>

                {/* Amenities */}
                <div className="flex gap-2 mb-4">
                    {property.hasElevator && (
                        <span className="px-2 py-1 bg-slate-700/30 rounded text-xs text-slate-400">
                            Asansör
                        </span>
                    )}
                    {property.hasParking && (
                        <span className="px-2 py-1 bg-slate-700/30 rounded text-xs text-slate-400 flex items-center gap-1">
                            <Car className="w-3 h-3" /> Otopark
                        </span>
                    )}
                </div>

                {/* Price Section */}
                <div className="flex justify-between items-end pt-3 border-t border-slate-700/50">
                    {property.currentValue && (
                        <div>
                            <p className="text-xs text-slate-500">Değer</p>
                            <p className="text-lg font-bold text-emerald-400">
                                {formatCurrency(property.currentValue)}
                            </p>
                        </div>
                    )}
                    {property.monthlyRent && (
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Aylık Kira</p>
                            <p className="text-sm font-medium text-blue-400">
                                {formatCurrency(property.monthlyRent)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Linked Parcel */}
                {property.parcel && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <Link
                            href={`/parcels/${property.parcel.id}`}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
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

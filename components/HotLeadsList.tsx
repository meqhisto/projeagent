"use client";

import Link from "next/link";
import { TrendingUp, MapPin, DollarSign } from "lucide-react";

interface HotLead {
    id: number;
    city: string;
    district: string;
    island: string;
    parcel: string;
    area?: number;
    roi?: number;
}

interface HotLeadsListProps {
    parcels: HotLead[];
}

export default function HotLeadsList({ parcels }: HotLeadsListProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    Hot Leads
                </h3>
                <span className="text-xs text-gray-500">Yüksek Öncelikli</span>
            </div>
            {parcels.length > 0 ? (
                <div className="space-y-3">
                    {parcels.map(parcel => (
                        <Link
                            key={parcel.id}
                            href={`/parcels/${parcel.id}`}
                            className="block bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-lg p-4 border border-red-200 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {parcel.city} / {parcel.district}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Ada: {parcel.island} | Parsel: {parcel.parsel}
                                    </p>
                                    {parcel.area && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {parcel.area} m²
                                        </p>
                                    )}
                                </div>
                                {parcel.roi && (
                                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        %{parcel.roi} ROI
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                    Henüz hot lead yok
                </div>
            )}
        </div>
    );
}

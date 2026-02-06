"use client";

import { Phone, Mail, Globe, MapPin, Building } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import type { Parcel, PresentationUserSettings } from "@/types";

interface ContactPageProps {
    data: {
        parcel: Parcel;
        userSettings: PresentationUserSettings;
        generatedAt: string;
    };
}

export default function ContactPage({ data }: ContactPageProps) {
    const { userSettings, parcel, generatedAt } = data;

    // Public sunum linki oluştur (bu sayfada QR kodu için)
    const presentationUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/parcels/${parcel.id}/presentation`
        : '';

    const date = new Date(generatedAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // İletişim bilgisi sayısını hesapla
    const contactItems = [
        userSettings.phone,
        userSettings.email,
        userSettings.website,
        userSettings.address
    ].filter(Boolean);

    // Tek satırda gösterilecekse col-1, çiftse col-2
    const gridCols = contactItems.length === 1 ? "grid-cols-1" : "grid-cols-2";

    return (
        <div
            className="min-h-[297mm] bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-12 flex flex-col"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-white">
                {/* Logo */}
                {userSettings.logoUrl && (
                    <div className="mb-8">
                        <img
                            src={userSettings.logoUrl}
                            alt="Logo"
                            className="h-20 object-contain"
                            crossOrigin="anonymous"
                        />
                    </div>
                )}

                {/* Company Name */}
                <h2 className="text-4xl font-bold mb-2 text-center">
                    {userSettings.companyName || 'İletişim'}
                </h2>

                <div className="w-24 h-1 bg-purple-500 rounded-full mb-12" />

                {/* Contact Grid - Dinamik */}
                <div className={`grid ${gridCols} gap-8 max-w-2xl w-full mb-12`}>
                    {userSettings.phone && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Telefon</div>
                                <div className="text-lg font-medium">{userSettings.phone}</div>
                            </div>
                        </div>
                    )}

                    {userSettings.email && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Mail className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">E-posta</div>
                                <div className="text-lg font-medium break-all">{userSettings.email}</div>
                            </div>
                        </div>
                    )}

                    {userSettings.website && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Globe className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Web</div>
                                <div className="text-lg font-medium">{userSettings.website}</div>
                            </div>
                        </div>
                    )}

                    {userSettings.address && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Adres</div>
                                <div className="text-sm font-medium">{userSettings.address}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* QR Code (for digital viewing only) */}
                {presentationUrl && (
                    <div className="bg-white rounded-xl p-4 mb-8 print:hidden">
                        <QRCodeSVG
                            value={presentationUrl}
                            size={120}
                            level="M"
                            includeMargin={false}
                        />
                        <p className="text-center text-xs text-gray-600 mt-2">Sunumu Görüntüle</p>
                    </div>
                )}

                {/* Parcel Reference */}
                <div className="text-center text-gray-400 text-sm">
                    <p className="flex items-center justify-center gap-2">
                        <Building className="h-4 w-4" />
                        {parcel.city}, {parcel.district} - Ada: {parcel.island}, Parsel: {parcel.parsel}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-xs pt-8 border-t border-white/10">
                <p>Bu sunum {date} tarihinde oluşturulmuştur.</p>
                <p className="mt-1">Bilgilendirme amaçlıdır, resmi belge niteliği taşımaz.</p>
            </div>
        </div>
    );
}

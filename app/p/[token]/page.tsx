"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, Eye } from "lucide-react";

// Public sunumda kullanılacak basitleştirilmiş sayfa bileşenleri
// Ana bileşenlerden farklı olarak auth gerektirmez

interface PresentationData {
    title?: string;
    parcel: any;
    images: any[];
    zoning: any;
    feasibility: any;
    regionalData: any[];
    userSettings: {
        companyName: string;
        email: string;
        phone: string | null;
        logoUrl: string | null;
        address: string | null;
        website: string | null;
    };
    shareInfo: {
        createdAt: string;
        viewCount: number;
    };
}

export default function PublicPresentationPage() {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<PresentationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/presentation/${token}`);

                if (res.ok) {
                    const presentationData = await res.json();
                    setData(presentationData);
                } else {
                    const errorData = await res.json();
                    setError(errorData.error || "Sunum bulunamadı");
                }
            } catch (err) {
                setError("Bir hata oluştu");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchData();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Sunum yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Sunum Bulunamadı</h1>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">
                            Bu link süresi dolmuş veya deaktif edilmiş olabilir.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const mainImage = data.images.find((img: any) => img.isDefault)?.url || data.images[0]?.url;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4">
                        {data.userSettings.logoUrl && (
                            <img
                                src={data.userSettings.logoUrl}
                                alt="Logo"
                                className="h-12 object-contain"
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">
                                {data.title || "Yatırımcı Sunumu"}
                            </h1>
                            <p className="text-purple-200">
                                {data.userSettings.companyName || ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Parsel Bilgileri */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    {/* Görsel */}
                    {mainImage && (
                        <div className="h-64 bg-gray-200">
                            <img
                                src={mainImage}
                                alt="Parsel"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {data.parcel.city}, {data.parcel.district}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">Mahalle</div>
                                <div className="font-bold text-gray-900">{data.parcel.neighborhood}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">Ada</div>
                                <div className="font-bold text-gray-900">{data.parcel.island}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">Parsel</div>
                                <div className="font-bold text-gray-900">{data.parcel.parsel}</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-purple-600 uppercase">Alan</div>
                                <div className="font-bold text-purple-900">
                                    {data.parcel.area ? data.parcel.area.toLocaleString('tr-TR') : '-'} m²
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* İmar Durumu */}
                {data.zoning && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="font-bold text-gray-900 mb-4">İmar Durumu</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">Emsal</div>
                                <div className="text-2xl font-bold text-gray-900">{data.zoning.ks || '-'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">TAKS</div>
                                <div className="text-2xl font-bold text-gray-900">{data.zoning.taks || '-'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">Fonksiyon</div>
                                <div className="text-lg font-bold text-gray-900">{data.zoning.zoningType || 'Konut'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fizibilite */}
                {data.feasibility && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="font-bold text-gray-900 mb-4">Fizibilite Analizi</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-purple-600 uppercase">Toplam Daire</div>
                                <div className="text-2xl font-bold text-purple-900">{data.feasibility.toplamDaire}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 text-center">
                                <div className="text-xs text-gray-500 uppercase">Arsa Sahibi Payı</div>
                                <div className="text-2xl font-bold text-gray-900">{data.feasibility.arsaSahibiDaire}</div>
                            </div>
                            <div className="bg-[#0071e3]/10 rounded-lg p-4 text-center">
                                <div className="text-xs text-[#0071e3] uppercase">ROI</div>
                                <div className="text-2xl font-bold text-emerald-900">{data.feasibility.roi}</div>
                            </div>
                            <div className={`rounded-lg p-4 text-center ${data.feasibility.durum === 'FIRSAT' ? 'bg-[#0071e3]/10' :
                                    data.feasibility.durum === 'RİSKLİ' ? 'bg-red-50' :
                                        'bg-blue-50'
                                }`}>
                                <div className="text-xs text-gray-500 uppercase">Durum</div>
                                <div className={`text-lg font-bold ${data.feasibility.durum === 'FIRSAT' ? 'text-[#0077ed]' :
                                        data.feasibility.durum === 'RİSKLİ' ? 'text-red-700' :
                                            'text-blue-700'
                                    }`}>
                                    {data.feasibility.durum}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-[#0071e3]/10 to-emerald-100 rounded-lg p-4 text-center">
                            <div className="text-sm text-[#0071e3]">Net Kâr Beklentisi</div>
                            <div className="text-3xl font-black text-[#0077ed]">{data.feasibility.netKar}</div>
                        </div>
                    </div>
                )}

                {/* İletişim */}
                <div className="bg-gradient-to-r from-purple-700 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="font-bold text-white mb-4">İletişim</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.userSettings.phone && (
                            <div>
                                <div className="text-xs text-purple-200 uppercase">Telefon</div>
                                <div className="font-medium">{data.userSettings.phone}</div>
                            </div>
                        )}
                        {data.userSettings.email && (
                            <div>
                                <div className="text-xs text-purple-200 uppercase">E-posta</div>
                                <div className="font-medium">{data.userSettings.email}</div>
                            </div>
                        )}
                        {data.userSettings.website && (
                            <div>
                                <div className="text-xs text-purple-200 uppercase">Web</div>
                                <div className="font-medium">{data.userSettings.website}</div>
                            </div>
                        )}
                        {data.userSettings.address && (
                            <div>
                                <div className="text-xs text-purple-200 uppercase">Adres</div>
                                <div className="font-medium">{data.userSettings.address}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Eye className="h-4 w-4" />
                        <span>{data.shareInfo.viewCount} görüntülenme</span>
                    </div>
                    <p>Bu sunum bilgilendirme amaçlıdır, resmi belge niteliği taşımaz.</p>
                </div>
            </div>
        </div>
    );
}

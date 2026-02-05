import { MapPin, Building, Ruler, Layers } from "lucide-react";

interface LocationPageProps {
    data: {
        parcel: any;
        zoning: any;
    };
}

export default function LocationPage({ data }: LocationPageProps) {
    const { parcel, zoning } = data;

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${parcel.city}+${parcel.district}+${parcel.neighborhood}+Ada+${parcel.island}+Parsel+${parcel.parsel}`;

    return (
        <div
            className="min-h-[297mm] bg-white p-12"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-purple-600" />
                    Konum & Fiziksel Özellikler
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Sol: Konum Bilgileri */}
                <div className="space-y-6">
                    {/* Adres Bilgileri */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            Adres Bilgileri
                        </h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 text-gray-500">İl</td>
                                    <td className="py-3 text-right font-bold text-gray-900">{parcel.city}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 text-gray-500">İlçe</td>
                                    <td className="py-3 text-right font-bold text-gray-900">{parcel.district}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 text-gray-500">Mahalle</td>
                                    <td className="py-3 text-right font-bold text-gray-900">{parcel.neighborhood}</td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 text-gray-500">Ada No</td>
                                    <td className="py-3 text-right font-bold text-gray-900">{parcel.island}</td>
                                </tr>
                                <tr>
                                    <td className="py-3 text-gray-500">Parsel No</td>
                                    <td className="py-3 text-right font-bold text-gray-900">{parcel.parsel}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Fiziksel Özellikler */}
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-purple-600" />
                            Fiziksel Özellikler
                        </h3>
                        <div className="text-center py-4">
                            <div className="text-4xl font-black text-purple-700">
                                {parcel.area ? parcel.area.toLocaleString('tr-TR') : '-'} m²
                            </div>
                            <div className="text-sm text-purple-600 mt-1">Yüz Ölçümü</div>
                        </div>
                        {parcel.latitude && parcel.longitude && (
                            <div className="mt-4 pt-4 border-t border-purple-200 text-center text-xs text-gray-500">
                                Koordinat: {parcel.latitude.toFixed(6)}, {parcel.longitude.toFixed(6)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sağ: İmar Durumu */}
                <div className="space-y-6">
                    {/* İmar Bilgileri */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            İmar Durumu
                        </h3>

                        {zoning ? (
                            <>
                                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fonksiyon</div>
                                    <div className="text-xl font-bold text-purple-700">{zoning.zoningType || 'Konut'}</div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Emsal (KAKS)</div>
                                        <div className="text-2xl font-black text-gray-900">{zoning.ks || '-'}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">TAKS</div>
                                        <div className="text-2xl font-black text-gray-900">{zoning.taks || '-'}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hmax</div>
                                        <div className="text-2xl font-black text-gray-900">{zoning.maxHeight || '-'}</div>
                                    </div>
                                </div>

                                {zoning.notes && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                        <strong>Not:</strong> {zoning.notes}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                İmar bilgisi bulunamadı
                            </div>
                        )}
                    </div>

                    {/* İnşaat Potansiyeli */}
                    {zoning && parcel.area && zoning.ks && (
                        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-[#0071e3]" />
                                İnşaat Potansiyeli
                            </h3>
                            <div className="text-center py-4">
                                <div className="text-4xl font-black text-[#0077ed]">
                                    {Math.round(parcel.area * zoning.ks).toLocaleString('tr-TR')} m²
                                </div>
                                <div className="text-sm text-[#0071e3] mt-1">Toplam İnşaat Alanı</div>
                                <div className="text-xs text-gray-500 mt-2">
                                    ({parcel.area.toLocaleString('tr-TR')} m² × {zoning.ks} emsal)
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Google Maps Link */}
            <div className="mt-8 text-center">
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                    <MapPin className="h-4 w-4" />
                    Google Maps'te Görüntüle
                </a>
            </div>
        </div>
    );
}

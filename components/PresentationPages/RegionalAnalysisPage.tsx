import { TrendingUp, MapPin, ExternalLink } from "lucide-react";

import type { Parcel, RegionalData, UserPrecedent } from "@/types";

interface RegionalAnalysisPageProps {
    data: {
        parcel: Parcel;
        regionalData: RegionalData[];
        userPrecedents?: UserPrecedent[];
    };
}

export default function RegionalAnalysisPage({ data }: RegionalAnalysisPageProps) {
    const { parcel, regionalData, userPrecedents = [] } = data;

    // Eğer hiç veri yoksa gösterme
    if ((!regionalData || regionalData.length === 0) && userPrecedents.length === 0) {
        return null;
    }

    // Bölge ortalaması hesapla (Sadece ZoningPrecedent'lerden - regionalData)
    // Manuel girilenlerin Kaks/Taks verisi her zaman olmayabilir, satış fiyatı odaklılar.
    const avgKs = regionalData.length > 0
        ? regionalData.reduce((sum, r) => sum + (r.ks || 0), 0) / regionalData.filter(r => r.ks).length
        : null;
    const avgTaks = regionalData.length > 0
        ? regionalData.reduce((sum, r) => sum + (r.taks || 0), 0) / regionalData.filter(r => r.taks).length
        : null;
    const avgMaxHeight = regionalData.length > 0
        ? regionalData.reduce((sum, r) => sum + (r.maxHeight || 0), 0) / regionalData.filter(r => r.maxHeight).length
        : null;

    // Satış Fiyatı Ortalaması (User Precedents)
    const avgPricePerM2 = userPrecedents.length > 0
        ? userPrecedents.reduce((sum, p) => sum + (p.pricePerM2 || 0), 0) / userPrecedents.filter(p => p.pricePerM2).length
        : null;

    return (
        <div
            className="min-h-[297mm] bg-white p-12"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    Bölge Analizi
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {parcel.city}, {parcel.district} bölgesindeki emsal veriler
                </p>
            </div>

            {/* Bölge Ortalamaları Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* İmar Ortalamaları */}
                {avgKs && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-4">İmar Emsalleri</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-xs text-gray-500 uppercase">Emsal</div>
                                <div className="text-2xl font-black text-gray-900">{avgKs.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase">TAKS</div>
                                <div className="text-2xl font-black text-gray-900">{avgTaks?.toFixed(2) || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase">Hmax</div>
                                <div className="text-2xl font-black text-gray-900">{avgMaxHeight?.toFixed(2) || '-'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fiyat Ortalamaları */}
                {avgPricePerM2 && (
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                        <h3 className="font-bold text-purple-900 mb-4">Piyasa Ortalaması</h3>
                        <div className="text-center">
                            <div className="text-xs text-purple-600 uppercase mb-1">Ortalama m² Satış Fiyatı</div>
                            <div className="text-3xl font-black text-purple-700">
                                {Math.round(avgPricePerM2).toLocaleString('tr-TR')} ₺
                            </div>
                            <div className="text-xs text-purple-500 mt-2">
                                {userPrecedents.length} adet emsal satış verisine göre
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Emsal Satış Tablosu (Manuel Girilenler) */}
            {userPrecedents.length > 0 && (
                <div className="mb-8">
                    <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 rounded-t-xl">
                        <h3 className="font-semibold text-gray-900">Emsal Satış İlanları</h3>
                    </div>
                    <div className="border border-gray-200 rounded-b-xl overflow-hidden bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Başlık</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Fiyat</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Alan</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">m² / TL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {userPrecedents.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                <span>{p.title}</span>
                                                {p.sourceUrl && (
                                                    <span className="text-xs text-blue-500 flex items-center gap-1 mt-0.5">
                                                        Çevrimiçi İlan
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">{p.price.toLocaleString('tr-TR')} ₺</td>
                                        <td className="px-6 py-3 text-right">{p.area ? `${p.area} m²` : '-'}</td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-900">
                                            {p.pricePerM2 ? Math.round(p.pricePerM2).toLocaleString('tr-TR') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* İmar Emsal Tablosu (Otomatik) */}
            {regionalData.length > 0 && (
                <div>
                    <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 rounded-t-xl">
                        <h3 className="font-semibold text-gray-900">Bölge İmar Emsalleri</h3>
                    </div>
                    <div className="border border-gray-200 rounded-b-xl overflow-hidden bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Konum</th>
                                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Tip</th>
                                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Emsal</th>
                                    <th className="px-6 py-3 text-center font-semibold text-gray-700">TAKS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {regionalData.map((precedent, index) => (
                                    <tr key={precedent.id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{precedent.neighborhood}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${precedent.type === 'RESIDENTIAL' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                                }`}>
                                                {precedent.type === 'RESIDENTIAL' ? 'Konut' : 'Ticari/Diğer'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center font-bold text-gray-900">
                                            {precedent.ks || '-'}
                                        </td>
                                        <td className="px-6 py-3 text-center font-bold text-gray-900">
                                            {precedent.taks || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

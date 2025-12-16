
import { MapPin, Building, Calculator, DollarSign, TrendingUp, Info } from "lucide-react";

interface ParcelReportTemplateProps {
    parcel: any;
    feasibilityResult: any;
}

export default function ParcelReportTemplate({ parcel, feasibilityResult }: ParcelReportTemplateProps) {
    if (!parcel) return null;

    const mainImage = parcel.images && parcel.images.length > 0 ? parcel.images[0].url : null;
    const date = new Date().toLocaleDateString('tr-TR');

    return (
        <div className="hidden print:block font-sans text-gray-900 bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm]">

            {/* Report Header */}
            <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">ARSA FİZİBİLİTE RAPORU</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-wider uppercase">Proje Geliştirme & Analiz</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{parcel.city}, {parcel.district}</p>
                    <p className="text-sm text-gray-500">Rapor Tarihi: {date}</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">

                {/* Visual */}
                <div className="col-span-1 h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                    {mainImage ? (
                        <img src={mainImage} className="w-full h-full object-cover" alt="Parcel" crossOrigin="anonymous" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Görsel Yok</div>
                    )}
                </div>

                {/* Key Details */}
                <div className="col-span-1 space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Lokasyon Bilgileri
                    </h3>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">İl / İlçe</td><td className="font-bold text-right">{parcel.city} / {parcel.district}</td></tr>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">Mahalle</td><td className="font-bold text-right">{parcel.neighborhood}</td></tr>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">Ada / Parsel</td><td className="font-bold text-right">{parcel.island} / {parcel.parcel}</td></tr>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">Yüz Ölçümü</td><td className="font-bold text-right">{parcel.area} m²</td></tr>
                        </tbody>
                    </table>

                    <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2 pt-2 flex items-center gap-2">
                        <Building className="h-4 w-4" /> İmar Durumu
                    </h3>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">Fonksiyon</td><td className="font-bold text-right">{parcel.zoning?.zoningType || '-'}</td></tr>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">Emsal (KAKS)</td><td className="font-bold text-right">{parcel.zoning?.ks || '-'}</td></tr>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">TAKS</td><td className="font-bold text-right">{parcel.zoning?.taks || '-'}</td></tr>
                            <tr className="border-b border-gray-100"><td className="py-1 text-gray-500">Yükseklik</td><td className="font-bold text-right">{parcel.zoning?.maxHeight || '-'}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Financial Analysis Section */}
            {feasibilityResult ? (
                <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-300 pb-2">
                            <Calculator className="h-5 w-5" /> Geliştirme Analizi
                        </h2>

                        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                            <div className="p-3 bg-white rounded border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase">Emsal İnşaat Alanı</div>
                                <div className="font-bold text-lg">{feasibilityResult.fiziksel_ozet.toplam_insaat_alani}</div>
                            </div>
                            <div className="p-3 bg-white rounded border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase">Toplam Daire</div>
                                <div className="font-bold text-lg">{feasibilityResult.fiziksel_ozet.toplam_daire_sayisi}</div>
                            </div>
                            <div className="p-3 bg-white rounded border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase">Müteahhit Payı</div>
                                <div className="font-bold text-lg text-purple-700">{feasibilityResult.fiziksel_ozet.muteahhit_daireleri} Konut</div>
                            </div>
                            <div className="p-3 bg-white rounded border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase">Arsa Sahibi Payı</div>
                                <div className="font-bold text-lg text-gray-700">{feasibilityResult.fiziksel_ozet.arsa_sahibi_daireleri} Konut</div>
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <DollarSign className="h-4 w-4" /> Finansal Göstergeler
                        </h3>
                        <table className="w-full text-sm border-collapse mb-6">
                            <thead className="bg-gray-100 text-gray-600 text-left">
                                <tr>
                                    <th className="p-2 border border-gray-200">Kalem</th>
                                    <th className="p-2 border border-gray-200 text-right">Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-2 border border-gray-200">Toplam İnşaat Maliyeti</td>
                                    <td className="p-2 border border-gray-200 text-right font-medium text-red-600">-{feasibilityResult.finansal_tablo.toplam_insaat_maliyeti}</td>
                                </tr>
                                <tr>
                                    <td className="p-2 border border-gray-200">Beklenen Satış Cirosu</td>
                                    <td className="p-2 border border-gray-200 text-right font-medium">{feasibilityResult.finansal_tablo.beklenen_ciro}</td>
                                </tr>
                                {feasibilityResult.serefiye_analizi && (
                                    <tr>
                                        <td className="p-2 border border-gray-200">Şerefiye Sonrası Ciro (Optimize)</td>
                                        <td className="p-2 border border-gray-200 text-right font-medium text-emerald-600">
                                            {feasibilityResult.serefiye_analizi.optimize_edilmis_ciro}
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-emerald-50">
                                    <td className="p-2 border border-emerald-100 font-bold text-gray-900">NET KÂR BEKLENTİSİ</td>
                                    <td className="p-2 border border-emerald-100 text-right font-bold text-xl text-emerald-700">{feasibilityResult.finansal_tablo.net_kar}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-sm mb-2 text-gray-900">ROI (Yatırım Dönüşü)</h4>
                                <p className="text-2xl font-black text-purple-700">{feasibilityResult.finansal_tablo.yatirim_donus_orani_roi}</p>
                            </div>
                            <div className="flex-1 bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-bold text-sm mb-2 text-gray-900">Karar Destek</h4>
                                <p className={`text-lg font-bold ${feasibilityResult.karar_destek.durum === "FIRSAT" ? "text-emerald-600" :
                                        feasibilityResult.karar_destek.durum === "RİSKLİ" ? "text-red-600" : "text-blue-600"
                                    }`}>
                                    {feasibilityResult.karar_destek.durum}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{feasibilityResult.karar_destek.yorum}</p>
                            </div>
                        </div>
                    </div>

                    {feasibilityResult.teklif_ozeti && (
                        <div className="mt-6 border border-blue-100 bg-blue-50/50 p-6 rounded-lg text-sm leading-relaxed text-gray-800">
                            <h3 className="font-bold text-blue-900 mb-2 uppercase text-xs tracking-wider">Arsa Sahibi Teklif Metni</h3>
                            <p className="italic">"{feasibilityResult.teklif_ozeti}"</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-8 border border-gray-200 rounded-lg text-center text-gray-400">
                    <p>Fizibilite analizi henüz yapılmamış.</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
                <p>Bu rapor ProjeAgent tarafından otomatik olarak oluşturulmuştur. Resmi belge niteliği taşımaz, bilgi amaçlıdır.</p>
            </div>
        </div>
    );
}

import { Calculator, TrendingUp, DollarSign, Building2, Wallet } from "lucide-react";

import type { Parcel, FeasibilityCalculation, UserPrecedent } from "@/types";

interface FeasibilityPageProps {
    data: {
        parcel: Parcel;
        userPrecedents: UserPrecedent[];
        feasibility: FeasibilityCalculation | null;
    };
}

export default function FeasibilityPage({ data }: FeasibilityPageProps) {
    const { feasibility, userPrecedents, parcel } = data;

    if (!feasibility) {
        return null;
    }

    // Cast explicitly for legacy fields dynamically accessed
    const result = (feasibility.fullResult as any) || {};

    // 1. Senaryo: Kat Karşılığı (Mevcut Veriler)
    // Müteahhit sadece inşaat maliyetini öder, dairelerin bir kısmını alır.

    // 2. Senaryo: Satın Al - Yap - Sat (Yeni)
    // Yatırımcı arsayı alır + inşaat yapar, dairelerin tamamını satar.

    // Arsa Değeri Tahmini (Emsallerden veya Arsa Sahibi Payından)
    let estimatedLandPrice = 0;
    let landPriceSource = "";

    // Emsallerden hesapla
    const avgPricePerM2 = userPrecedents && userPrecedents.length > 0
        ? userPrecedents.reduce((sum, p) => sum + (p.pricePerM2 || 0), 0) / userPrecedents.filter(p => p.pricePerM2).length
        : 0;

    if (avgPricePerM2 > 0 && parcel.area) {
        estimatedLandPrice = avgPricePerM2 * parcel.area;
        landPriceSource = "Bölge Emsallerine Göre";
    } else {
        // Fallback: Arsa Sahibi Payının Satış Değeri (Bu daireleri satarak elde edeceği gelir ~= Arsa Değeri)
        // result.finansal_tablo.beklenen_ciro TOPLAM ciro sanırım?
        // Arsa sahibi payı oranı * Toplam Ciro = Arsa Değeri
        const totalRevenue = parseFloat(result.finansal_tablo?.beklenen_ciro?.replace(/\./g, '').replace(/,/g, '.') || "0");
        const landOwnerShare = feasibility.arsaSahibiDaire / feasibility.toplamDaire;
        estimatedLandPrice = totalRevenue * landOwnerShare;
        landPriceSource = "Kat Karşılığı Oranına Göre";
    }

    // Satın Alma Senaryosu Hesaplamaları
    const constructionCost = result.finansal_tablo?.toplam_insaat_maliyeti
        ? parseFloat(result.finansal_tablo.toplam_insaat_maliyeti.replace(/\./g, '').replace(/,/g, '.'))
        : feasibility.insaatMaliyeti * feasibility.arsaM2 * (feasibility.emsal || 1); // Fallback calc if needed

    const totalDevelopmentCost = estimatedLandPrice + constructionCost;

    // Toplam Gelir (Tüm dairelerin satışı)
    const totalRevenue = parseFloat(result.finansal_tablo?.beklenen_ciro?.replace(/\./g, '').replace(/,/g, '.') || "0");

    const buyScenarioProfit = totalRevenue - totalDevelopmentCost;
    const buyScenarioROI = (buyScenarioProfit / totalDevelopmentCost) * 100;

    return (
        <div
            className="min-h-[297mm] bg-white p-12"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-purple-600" />
                    Yatırım Senaryoları & Fizibilite
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Kat Karşılığı ve Satın Alma Modelleri Karşılaştırması
                </p>
            </div>

            {/* Senaryo 1: Kat Karşılığı (Müteahhit Modeli) */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900">Senaryo A: Kat Karşılığı (Müteahhit)</h3>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Kat Karşılığı Oranı</div>
                        <div className="text-2xl font-black text-gray-900">%{Math.round(feasibility.katKarsiligiOrani * 100)}</div>
                        <div className="text-xs text-purple-600 mt-1 font-medium">Arsa Sahibine Verilen</div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Müteahhit Payı</div>
                        <div className="text-2xl font-black text-gray-900">{feasibility.muteahhitDaire} Daire</div>
                        <div className="text-xs text-gray-500 mt-1">Toplam {feasibility.toplamDaire} daireden</div>
                    </div>

                    <div className={`rounded-xl p-5 border-2 ${feasibility.durum === 'FIRSAT' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="text-xs uppercase tracking-wide text-gray-600 mb-1">Net Kâr Beklentisi</div>
                        <div className="text-2xl font-black text-gray-900">{feasibility.netKar}</div>
                        <div className="text-sm font-bold text-[#0071e3] mt-1">ROI: {feasibility.roi}</div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 my-8"></div>

            {/* Senaryo 2: Satın Alma (Yatırımcı Modeli) */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="h-5 w-5 text-[#0071e3]" />
                    <h3 className="text-xl font-bold text-gray-900">Senaryo B: Satın Al - Yap - Sat (Yatırımcı)</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">Tam Mülkiyet</span>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-medium mb-1">Tahmini Arsa Bedeli</div>
                            <div className="text-xl font-bold text-gray-900">
                                {estimatedLandPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">{landPriceSource}</div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase font-medium mb-1">İnşaat Maliyeti</div>
                            <div className="text-xl font-bold text-gray-900">
                                {constructionCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                            <div className="text-xs text-[#0071e3] uppercase font-bold mb-1">Toplam Ciro (Satış)</div>
                            <div className="text-xl font-black text-[#0077ed]">
                                {totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </div>
                            <div className="text-[10px] text-[#0071e3] mt-1">Tüm dairelerin satışı</div>
                        </div>

                        <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-sm">
                            <div className="text-xs text-[#0071e3] uppercase font-bold mb-1">Net Kâr</div>
                            <div className="text-xl font-black text-[#0077ed]">
                                {buyScenarioProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </div>
                            <div className="text-xs font-bold text-[#0071e3] mt-1">ROI: %{buyScenarioROI.toFixed(1)}</div>
                        </div>
                    </div>

                    {/* Karşılaştırma Notu */}
                    <div className="text-sm text-gray-600 bg-white/50 p-4 rounded-lg">
                        <p>
                            <strong>Analiz:</strong> Eğer arsayı <strong>{estimatedLandPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</strong> bedelle satın alırsanız,
                            proje sonunda <strong>%{buyScenarioROI.toFixed(1)}</strong> oranında getiri elde edebilirsiniz.
                            Kat karşılığı modeline göre {
                                buyScenarioROI > parseFloat(feasibility.roi.replace('%', ''))
                                    ? <span className="text-[#0071e3] font-bold">daha kârlı</span>
                                    : <span className="text-blue-600 font-bold">benzer veya daha düşük</span>
                            } bir yatırım fırtası sunabilir.
                        </p>
                    </div>
                </div>
            </div>

            {/* Finansal Detaylar Tablosu (Ortak) */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    Proje Metrikleri
                </h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-xs text-gray-500">Arsa Alanı</div>
                        <div className="font-bold">{feasibility.arsaM2.toLocaleString('tr-TR')} m²</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Emsal</div>
                        <div className="font-bold">{feasibility.emsal}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Toplam İnşaat Alanı</div>
                        <div className="font-bold">{(feasibility.arsaM2 * feasibility.emsal).toLocaleString('tr-TR')} m²</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Toplam Daire</div>
                        <div className="font-bold">{feasibility.toplamDaire} Adet</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

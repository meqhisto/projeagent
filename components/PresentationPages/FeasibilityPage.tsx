import { Calculator, TrendingUp, PieChart, DollarSign } from "lucide-react";

interface FeasibilityPageProps {
    data: {
        feasibility: {
            fullResult: any;
            arsaM2: number;
            emsal: number;
            katKarsiligiOrani: number;
            toplamDaire: number;
            muteahhitDaire: number;
            arsaSahibiDaire: number;
            netKar: string;
            roi: string;
            durum: string;
        };
    };
}

export default function FeasibilityPage({ data }: FeasibilityPageProps) {
    const { feasibility } = data;

    if (!feasibility) {
        return null;
    }

    const result = feasibility.fullResult || {};

    return (
        <div
            className="min-h-[297mm] bg-white p-12"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-purple-600" />
                    Fizibilite Analizi
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Proje geliştirme potansiyeli ve finansal göstergeler
                </p>
            </div>

            {/* Durum ve ROI */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`rounded-xl p-6 border-2 ${feasibility.durum === 'FIRSAT' ? 'bg-emerald-50 border-emerald-400' :
                        feasibility.durum === 'RİSKLİ' ? 'bg-red-50 border-red-400' :
                            'bg-blue-50 border-blue-400'
                    }`}>
                    <div className="text-xs uppercase tracking-wide font-medium mb-2 text-gray-600">Karar Desteği</div>
                    <div className={`text-4xl font-black ${feasibility.durum === 'FIRSAT' ? 'text-emerald-700' :
                            feasibility.durum === 'RİSKLİ' ? 'text-red-700' :
                                'text-blue-700'
                        }`}>
                        {feasibility.durum}
                    </div>
                    {result.karar_destek?.yorum && (
                        <p className="text-sm text-gray-600 mt-2">{result.karar_destek.yorum}</p>
                    )}
                </div>

                <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-400">
                    <div className="text-xs uppercase tracking-wide font-medium mb-2 text-gray-600">Yatırım Getirisi (ROI)</div>
                    <div className="text-4xl font-black text-purple-700">
                        {feasibility.roi}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Toplam yatırım üzerinden beklenen getiri</p>
                </div>
            </div>

            {/* Fiziksel Özet */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Arsa Alanı</div>
                    <div className="text-2xl font-bold text-gray-900">{feasibility.arsaM2.toLocaleString('tr-TR')} m²</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Emsal</div>
                    <div className="text-2xl font-bold text-gray-900">{feasibility.emsal}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Toplam Daire</div>
                    <div className="text-2xl font-bold text-gray-900">{feasibility.toplamDaire}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Kat Karşılığı</div>
                    <div className="text-2xl font-bold text-gray-900">%{Math.round(feasibility.katKarsiligiOrani * 100)}</div>
                </div>
            </div>

            {/* Daire Paylaşımı */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-gray-500" />
                    Daire Paylaşımı
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-purple-100 rounded-xl p-6 text-center">
                        <div className="text-5xl font-black text-purple-700 mb-2">
                            {feasibility.muteahhitDaire}
                        </div>
                        <div className="text-sm font-medium text-purple-600">Müteahhit Payı</div>
                        <div className="text-xs text-purple-500 mt-1">
                            %{Math.round((feasibility.muteahhitDaire / feasibility.toplamDaire) * 100)} oran
                        </div>
                    </div>
                    <div className="bg-gray-200 rounded-xl p-6 text-center">
                        <div className="text-5xl font-black text-gray-700 mb-2">
                            {feasibility.arsaSahibiDaire}
                        </div>
                        <div className="text-sm font-medium text-gray-600">Arsa Sahibi Payı</div>
                        <div className="text-xs text-gray-500 mt-1">
                            %{Math.round((feasibility.arsaSahibiDaire / feasibility.toplamDaire) * 100)} oran
                        </div>
                    </div>
                </div>
            </div>

            {/* Finansal Tablo */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    Finansal Göstergeler
                </h3>

                {result.finansal_tablo ? (
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="py-3 text-gray-600">Toplam İnşaat Maliyeti</td>
                                <td className="py-3 text-right font-bold text-red-600">
                                    -{result.finansal_tablo.toplam_insaat_maliyeti}
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-3 text-gray-600">Beklenen Satış Cirosu</td>
                                <td className="py-3 text-right font-bold text-gray-900">
                                    {result.finansal_tablo.beklenen_ciro}
                                </td>
                            </tr>
                            {result.serefiye_analizi?.optimize_edilmis_ciro && (
                                <tr className="border-b border-gray-200">
                                    <td className="py-3 text-gray-600">Şerefiye Sonrası Ciro</td>
                                    <td className="py-3 text-right font-bold text-emerald-600">
                                        {result.serefiye_analizi.optimize_edilmis_ciro}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-emerald-50">
                                <td className="py-4 font-bold text-gray-900">NET KÂR BEKLENTİSİ</td>
                                <td className="py-4 text-right text-2xl font-black text-emerald-700">
                                    {feasibility.netKar}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-2xl font-bold text-emerald-700">{feasibility.netKar}</p>
                        <p className="text-sm text-gray-500 mt-1">Net Kâr Beklentisi</p>
                    </div>
                )}
            </div>
        </div>
    );
}

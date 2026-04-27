import { FileText, CheckCircle, AlertCircle } from "lucide-react";

interface ProposalPageProps {
    data: {
        parcel: any;
        feasibility: {
            fullResult: any;
            katKarsiligiOrani: number;
            arsaSahibiDaire: number;
            toplamDaire: number;
        };
    };
}

export default function ProposalPage({ data }: ProposalPageProps) {
    const { feasibility, parcel } = data;

    if (!feasibility) {
        return null;
    }

    const result = feasibility.fullResult || {};
    const teklifOzeti = result.teklif_ozeti;
    const katKarsiligi = Math.round(feasibility.katKarsiligiOrani * 100);

    return (
        <div
            className="min-h-[297mm] bg-white p-12"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    Yatırım Teklifi
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Arsa sahibi için önerilen kat karşılığı anlaşması
                </p>
            </div>

            {/* Teklif Özeti */}
            {teklifOzeti && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Arsa Sahibine Teklif Özeti</h3>
                    <p className="text-gray-700 leading-relaxed italic text-lg">
                        "{teklifOzeti}"
                    </p>
                </div>
            )}

            {/* Kat Karşılığı Detayları */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Sol: Oranlar */}
                <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
                    <h3 className="font-bold text-gray-900 mb-6">Önerilen Paylaşım Oranı</h3>

                    <div className="space-y-6">
                        {/* Visual Bar */}
                        <div className="relative h-12 rounded-lg overflow-hidden bg-gray-200">
                            <div
                                className="absolute left-0 top-0 h-full bg-purple-600 flex items-center justify-center text-white font-bold"
                                style={{ width: `${100 - katKarsiligi}%` }}
                            >
                                Müteahhit %{100 - katKarsiligi}
                            </div>
                            <div
                                className="absolute right-0 top-0 h-full bg-gray-500 flex items-center justify-center text-white font-bold"
                                style={{ width: `${katKarsiligi}%` }}
                            >
                                Arsa Sahibi %{katKarsiligi}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-3xl font-black text-purple-700">
                                    %{100 - katKarsiligi}
                                </div>
                                <div className="text-sm text-purple-600">Müteahhit Payı</div>
                            </div>
                            <div className="text-center p-4 bg-gray-100 rounded-lg">
                                <div className="text-3xl font-black text-gray-700">
                                    %{katKarsiligi}
                                </div>
                                <div className="text-sm text-gray-600">Arsa Sahibi Payı</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sağ: Daire Dağılımı */}
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-6">Daire Dağılımı</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <span className="text-gray-700">Müteahhit Alacağı Daire</span>
                            <span className="text-2xl font-black text-purple-700">
                                {feasibility.toplamDaire - feasibility.arsaSahibiDaire} Adet
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                            <span className="text-gray-700">Arsa Sahibi Alacağı Daire</span>
                            <span className="text-2xl font-black text-[#0077ed]">
                                {feasibility.arsaSahibiDaire} Adet
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-t-2 border-gray-300">
                            <span className="font-medium text-gray-700">Toplam</span>
                            <span className="text-2xl font-black text-gray-900">
                                {feasibility.toplamDaire} Adet
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Avantajlar */}
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#0071e3]" />
                    Arsa Sahibi Avantajları
                </h3>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#0071e3] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Yatırım yapmadan, arsanızı değerlendirme fırsatı</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#0071e3] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                            {feasibility.arsaSahibiDaire} adet modern, satışa hazır daire
                        </span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#0071e3] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Tüm inşaat ve ruhsat süreçleri müteahhit tarafından yürütülür</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#0071e3] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Her aşamada yasal güvence ile korunan haklar</span>
                    </li>
                </ul>
            </div>

            {/* Uyarı */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-yellow-800">
                        <strong>Önemli:</strong> Bu teklif bir ön değerlendirmedir. Kesin koşullar için noter huzurunda
                        yapılacak sözleşme esastır.
                    </p>
                </div>
            </div>
        </div>
    );
}

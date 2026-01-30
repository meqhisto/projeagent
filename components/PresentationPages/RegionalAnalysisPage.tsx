import { TrendingUp, MapPin } from "lucide-react";

interface RegionalAnalysisPageProps {
    data: {
        parcel: any;
        regionalData: any[];
    };
}

export default function RegionalAnalysisPage({ data }: RegionalAnalysisPageProps) {
    const { parcel, regionalData } = data;

    if (!regionalData || regionalData.length === 0) {
        return null;
    }

    // Bölge ortalaması hesapla
    const avgKs = regionalData.reduce((sum, r) => sum + (r.ks || 0), 0) / regionalData.filter(r => r.ks).length;
    const avgTaks = regionalData.reduce((sum, r) => sum + (r.taks || 0), 0) / regionalData.filter(r => r.taks).length;
    const avgMaxHeight = regionalData.reduce((sum, r) => sum + (r.maxHeight || 0), 0) / regionalData.filter(r => r.maxHeight).length;

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

            {/* Bölge Ortalamaları */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 text-center">
                    <div className="text-xs text-purple-600 uppercase tracking-wide font-medium mb-2">Ortalama Emsal</div>
                    <div className="text-4xl font-black text-purple-700">
                        {avgKs ? avgKs.toFixed(2) : '-'}
                    </div>
                    <div className="text-sm text-purple-500 mt-1">KAKS</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 text-center">
                    <div className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-2">Ortalama TAKS</div>
                    <div className="text-4xl font-black text-blue-700">
                        {avgTaks ? avgTaks.toFixed(2) : '-'}
                    </div>
                    <div className="text-sm text-blue-500 mt-1">Taban Alanı Oranı</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 text-center">
                    <div className="text-xs text-emerald-600 uppercase tracking-wide font-medium mb-2">Ortalama Yükseklik</div>
                    <div className="text-4xl font-black text-emerald-700">
                        {avgMaxHeight ? avgMaxHeight.toFixed(1) : '-'}
                    </div>
                    <div className="text-sm text-emerald-500 mt-1">metre</div>
                </div>
            </div>

            {/* Emsal Verileri Tablosu */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Bölge Emsalleri</h3>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-6 py-3 font-semibold text-gray-700">Mahalle</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-center">Tip</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-center">Emsal</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-center">TAKS</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-center">Hmax</th>
                        </tr>
                    </thead>
                    <tbody>
                        {regionalData.map((precedent, index) => (
                            <tr key={precedent.id || index} className="border-t border-gray-100">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{precedent.neighborhood}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${precedent.type === 'RESIDENTIAL' ? 'bg-green-100 text-green-700' :
                                            precedent.type === 'COMMERCIAL' ? 'bg-blue-100 text-blue-700' :
                                                'bg-purple-100 text-purple-700'
                                        }`}>
                                        {precedent.type === 'RESIDENTIAL' ? 'Konut' :
                                            precedent.type === 'COMMERCIAL' ? 'Ticari' :
                                                'Karma'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-center font-bold text-gray-900">
                                    {precedent.ks || '-'}
                                </td>
                                <td className="px-6 py-3 text-center font-bold text-gray-900">
                                    {precedent.taks || '-'}
                                </td>
                                <td className="px-6 py-3 text-center font-bold text-gray-900">
                                    {precedent.maxHeight || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Not */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Bu veriler bölgedeki benzer parsellerin ortalama imar değerlerini göstermektedir.
                    Kesin değerler için belediye imar müdürlüğüne başvurunuz.
                </p>
            </div>
        </div>
    );
}

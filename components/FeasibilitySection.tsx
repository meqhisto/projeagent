"use client";

import { useState, useEffect, useCallback } from "react";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, History, Trash2, Eye, ChevronDown, ChevronUp, Save } from "lucide-react";

interface FeasibilityCalculation {
    id: number;
    arsaM2: number;
    emsal: number;
    katKarsiligiOrani: number;
    ortalamaDaireBrutu: number;
    insaatMaliyeti: number;
    satisFiyati: number;
    bonusFactor: number | null;
    katAdedi: number | null;
    toplamDaire: number;
    muteahhitDaire: number;
    arsaSahibiDaire: number;
    netKar: string;
    roi: string;
    durum: string;
    fullResult: string;
    createdAt: string;
}

interface FeasibilitySectionProps {
    parcelId: number;
    parcelArea: number;
    initialKs?: number;
    initialTaks?: number;
    onCalculateSuccess?: (result: any) => void;
}

export default function FeasibilitySection({
    parcelId,
    parcelArea,
    initialKs,
    initialTaks,
    onCalculateSuccess
}: FeasibilitySectionProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [savedCalculations, setSavedCalculations] = useState<FeasibilityCalculation[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<FeasibilityCalculation | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Inputs
    const [inputs, setInputs] = useState({
        arsa_m2: parcelArea || 0,
        emsal: initialKs || 1.5,
        kat_karsiligi_orani: 0.50,
        ortalama_daire_brutu: 100,
        insaat_maliyeti: 20000,
        satis_fiyati: 60000,
        bonus_factor: 1.30,
        kat_adedi: 5
    });

    // Geçmiş hesaplamaları yükle
    const fetchCalculations = useCallback(async () => {
        if (!parcelId) return;

        setLoadingHistory(true);
        try {
            const res = await fetch(`/api/parcels/${parcelId}/calculations`);
            if (res.ok) {
                const data = await res.json();
                setSavedCalculations(data);
            }
        } catch (error) {
            console.error("Hesaplama geçmişi yüklenemedi:", error);
        } finally {
            setLoadingHistory(false);
        }
    }, [parcelId]);

    useEffect(() => {
        fetchCalculations();
    }, [fetchCalculations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const val = value === "" ? 0 : parseFloat(value);
        setInputs(prev => ({ ...prev, [name]: val }));
    };

    // Hesaplamayı veritabanına kaydet
    const saveCalculation = async (calculationResult: any) => {
        if (!parcelId) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/parcels/${parcelId}/calculations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    arsaM2: inputs.arsa_m2,
                    emsal: inputs.emsal,
                    katKarsiligiOrani: inputs.kat_karsiligi_orani,
                    ortalamaDaireBrutu: inputs.ortalama_daire_brutu,
                    insaatMaliyeti: inputs.insaat_maliyeti,
                    satisFiyati: inputs.satis_fiyati,
                    bonusFactor: inputs.bonus_factor,
                    katAdedi: inputs.kat_adedi,
                    toplamDaire: calculationResult.fiziksel_ozet.toplam_daire_sayisi,
                    muteahhitDaire: calculationResult.fiziksel_ozet.muteahhit_daireleri,
                    arsaSahibiDaire: calculationResult.fiziksel_ozet.arsa_sahibi_daireleri,
                    netKar: calculationResult.finansal_tablo.net_kar,
                    roi: calculationResult.finansal_tablo.yatirim_donus_orani_roi,
                    durum: calculationResult.karar_destek.durum,
                    fullResult: JSON.stringify(calculationResult)
                })
            });

            if (res.ok) {
                // Listeyi yenile
                fetchCalculations();
            } else {
                console.error("Hesaplama kaydedilemedi");
            }
        } catch (error) {
            console.error("Kaydetme hatası:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCalculate = async () => {
        if (!inputs.arsa_m2 || inputs.arsa_m2 <= 0) {
            alert("Lütfen geçerli bir arsa alanı giriniz.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/proxy/calculate/strict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    arsa_m2: inputs.arsa_m2,
                    emsal: inputs.emsal,
                    kat_karsiligi_orani: inputs.kat_karsiligi_orani,
                    ortalama_daire_brutu: inputs.ortalama_daire_brutu,
                    insaat_maliyeti_m2: inputs.insaat_maliyeti,
                    satis_fiyati_m2: inputs.satis_fiyati,
                    bonus_factor: inputs.bonus_factor,
                    kat_adedi: inputs.kat_adedi
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setSelectedHistoryItem(null);

                // Otomatik kaydet
                await saveCalculation(data);

                if (onCalculateSuccess) {
                    onCalculateSuccess(data);
                }
            } else {
                const err = await res.text();
                try {
                    const jsonErr = JSON.parse(err);
                    alert(jsonErr.detail || "Hesaplama hatası");
                } catch {
                    alert("Hesaplama başarısız oldu.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Sunucu hatası.");
        } finally {
            setLoading(false);
        }
    };

    // Geçmiş hesaplamayı görüntüle
    const viewHistoryItem = (item: FeasibilityCalculation) => {
        try {
            const fullResult = JSON.parse(item.fullResult);
            setResult(fullResult);
            setSelectedHistoryItem(item);
        } catch (error) {
            console.error("Hesaplama detayı parse edilemedi:", error);
        }
    };

    // Hesaplamayı sil
    const deleteCalculation = async (calculationId: number) => {
        if (!confirm("Bu hesaplamayı silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/parcels/${parcelId}/calculations?calculationId=${calculationId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchCalculations();
                if (selectedHistoryItem?.id === calculationId) {
                    setSelectedHistoryItem(null);
                    setResult(null);
                }
            }
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    // Tarih formatlama
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Ana Hesaplama Bölümü */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Calculator className="w-32 h-32 text-purple-900" />
                </div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 rounded-lg shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Müteahhit Hesabı (Kat Karşılığı)</h3>
                            <p className="text-xs text-gray-500">Gelişmiş Fizibilite Hesaplayıcı</p>
                        </div>
                    </div>
                    {saving && (
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                            <Save className="h-4 w-4 animate-pulse" />
                            <span>Kaydediliyor...</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                    {/* Inputs Panel (Left) */}
                    <div className="lg:col-span-5 bg-gray-50/80 p-5 rounded-xl border border-gray-100 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Arsa Alanı (m²)</label>
                                <input type="number" name="arsa_m2" value={inputs.arsa_m2} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Emsal (KAKS)</label>
                                <input type="number" step="0.1" name="emsal" value={inputs.emsal} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Arsa Payı (%50=0.5)</label>
                                <input type="number" step="0.05" max="1" min="0" name="kat_karsiligi_orani" value={inputs.kat_karsiligi_orani} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Ort. Daire Brütü (m²)</label>
                                <input type="number" name="ortalama_daire_brutu" value={inputs.ortalama_daire_brutu} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">İnşaat Maliyeti (TL/m²)</label>
                                <input type="number" step="1000" name="insaat_maliyeti" value={inputs.insaat_maliyeti} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Satış Fiyatı (TL/m²)</label>
                                <input type="number" step="1000" name="satis_fiyati" value={inputs.satis_fiyati} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Kat Adedi (Şerefiye İçin)</label>
                                <input type="number" name="kat_adedi" value={inputs.kat_adedi} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Bonus Katsayısı (Balkon vb.)</label>
                                <input type="number" step="0.1" name="bonus_factor" value={inputs.bonus_factor} onChange={handleChange} className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                        </div>

                        <button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full bg-purple-700 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-purple-800 transition-all flex justify-center items-center gap-2"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            {loading ? "HESAPLANIYOR..." : "ANALİZ ET"}
                        </button>
                    </div>

                    {/* Results Panel (Right) */}
                    <div className="lg:col-span-7 bg-white">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-10 opacity-60 border-2 border-dashed border-gray-100 rounded-xl">
                                <TrendingUp className="h-10 w-10 text-gray-300" />
                                <span className="text-sm font-medium">Verileri girip &quot;Analiz Et&quot; butonuna basın.</span>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                {/* Viewing History Notice */}
                                {selectedHistoryItem && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-amber-800">
                                            <History className="h-4 w-4" />
                                            <span>Geçmiş hesaplama görüntüleniyor: {formatDate(selectedHistoryItem.createdAt)}</span>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedHistoryItem(null); setResult(null); }}
                                            className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                                        >
                                            Kapat
                                        </button>
                                    </div>
                                )}

                                {/* Decision Card */}
                                <div className={`p-4 rounded-xl border flex items-start gap-4 ${result.karar_destek.durum === "RİSKLİ" ? "bg-red-50 border-red-100 text-red-900" :
                                    result.karar_destek.durum === "FIRSAT" ? "bg-emerald-50 border-emerald-100 text-emerald-900" :
                                        "bg-blue-50 border-blue-100 text-blue-900"
                                    }`}>
                                    {result.karar_destek.durum === "RİSKLİ" ? <AlertTriangle className="h-8 w-8 text-red-600 shrink-0" /> : <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />}
                                    <div>
                                        <h4 className="font-bold text-xl mb-1">{result.karar_destek.durum} - ROI: {result.finansal_tablo.yatirim_donus_orani_roi}</h4>
                                        <p className="text-sm opacity-90 leading-relaxed font-medium">{result.karar_destek.yorum}</p>
                                        <p className="text-xs opacity-70 mt-2 italic">👉 Öneri: {result.karar_destek.oneri}</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Müteahhit Daire</div>
                                        <div className="text-lg font-bold text-purple-700">{result.fiziksel_ozet.muteahhit_daireleri}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Arsa S. Daire</div>
                                        <div className="text-lg font-bold text-gray-700">{result.fiziksel_ozet.arsa_sahibi_daireleri}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Toplam Daire</div>
                                        <div className="text-lg font-bold text-gray-900">{result.fiziksel_ozet.toplam_daire_sayisi}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Top. İnşaat Alanı</div>
                                        <div className="text-sm font-bold text-gray-900">{result.fiziksel_ozet.toplam_insaat_alani}</div>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="space-y-4">
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                                        <div className="flex justify-between p-3 text-sm bg-gray-50/50">
                                            <span className="text-gray-600 font-medium">Toplam Beklenen Ciro</span>
                                            <span className="font-bold text-gray-900">{result.finansal_tablo.beklenen_ciro}</span>
                                        </div>
                                        <div className="flex justify-between p-3 text-sm">
                                            <span className="text-gray-600">Toplam İnşaat Maliyeti</span>
                                            <span className="font-medium text-red-600">-{result.finansal_tablo.toplam_insaat_maliyeti}</span>
                                        </div>
                                        <div className="flex justify-between p-4 text-base bg-emerald-50/30">
                                            <span className="font-bold text-gray-800">NET KÂR</span>
                                            <span className="font-bold text-emerald-600 text-lg">{result.finansal_tablo.net_kar}</span>
                                        </div>
                                    </div>

                                    {/* Goodwill & Cash Flow */}
                                    {result.serefiye_analizi && (
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-4 w-4 text-amber-600" />
                                                <h4 className="font-bold text-amber-800 text-sm">Şerefiye & Nakit Analizi</h4>
                                            </div>
                                            <div className="flex justify-between text-xs text-amber-900">
                                                <span>Müteahhit Şerefiyeli Ciro:</span>
                                                <span className="font-bold">{result.serefiye_analizi.optimize_edilmis_ciro}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-amber-900">
                                                <span>Maksimum Nakit İhtiyacı:</span>
                                                <span className="font-bold">{result.finansal_simulasyon.maksimum_nakit_ihtiyaci}</span>
                                            </div>
                                            <div className="text-[10px] bg-white/50 p-2 rounded text-amber-800 italic border border-amber-100">
                                                {result.finansal_simulasyon.uyari}
                                            </div>
                                        </div>
                                    )}

                                    {/* Proposal */}
                                    {result.teklif_ozeti && (
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <h4 className="font-bold text-blue-800 text-xs mb-2 uppercase tracking-wide">Arsa Sahibi Teklif Özeti</h4>
                                            <p className="text-xs text-blue-900 leading-relaxed font-medium">&quot;{result.teklif_ozeti}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Son 5 Hesaplama Geçmişi */}
            <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 rounded-lg">
                            <History className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-900">Hesaplama Geçmişi</h3>
                            <p className="text-xs text-gray-500">Son {savedCalculations.length} hesaplama</p>
                        </div>
                    </div>
                    {showHistory ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </button>

                {showHistory && (
                    <div className="border-t border-gray-100">
                        {loadingHistory ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                <span className="text-sm">Yükleniyor...</span>
                            </div>
                        ) : savedCalculations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Henüz hesaplama yapılmamış</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                        <tr>
                                            <th className="text-left p-3 font-semibold">Tarih</th>
                                            <th className="text-center p-3 font-semibold">Arsa m²</th>
                                            <th className="text-center p-3 font-semibold">Emsal</th>
                                            <th className="text-center p-3 font-semibold">Daire</th>
                                            <th className="text-center p-3 font-semibold">Net Kâr</th>
                                            <th className="text-center p-3 font-semibold">ROI</th>
                                            <th className="text-center p-3 font-semibold">Durum</th>
                                            <th className="text-center p-3 font-semibold">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {savedCalculations.map((calc) => (
                                            <tr
                                                key={calc.id}
                                                className={`hover:bg-gray-50 transition-colors ${selectedHistoryItem?.id === calc.id ? "bg-purple-50" : ""
                                                    }`}
                                            >
                                                <td className="p-3 text-gray-700 whitespace-nowrap">
                                                    {formatDate(calc.createdAt)}
                                                </td>
                                                <td className="p-3 text-center text-gray-900 font-medium">
                                                    {calc.arsaM2.toLocaleString("tr-TR")}
                                                </td>
                                                <td className="p-3 text-center text-gray-700">
                                                    {calc.emsal}
                                                </td>
                                                <td className="p-3 text-center text-gray-900 font-medium">
                                                    {calc.toplamDaire}
                                                </td>
                                                <td className="p-3 text-center text-emerald-600 font-bold">
                                                    {calc.netKar}
                                                </td>
                                                <td className="p-3 text-center text-purple-700 font-medium">
                                                    {calc.roi}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${calc.durum === "FIRSAT"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : calc.durum === "RİSKLİ"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-blue-100 text-blue-700"
                                                        }`}>
                                                        {calc.durum}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => viewHistoryItem(calc)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                                            title="Görüntüle"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteCalculation(calc.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

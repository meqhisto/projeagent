"use client";

import { useState } from "react";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface FeasibilitySectionProps {
    parcelArea: number;
    initialKs?: number;
    initialTaks?: number;
    onCalculateSuccess?: (result: any) => void;
}

export default function FeasibilitySection({ parcelArea, initialKs, initialTaks, onCalculateSuccess }: FeasibilitySectionProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // If empty, set to 0 to avoid NaN, or handle inputs as strings ideally.
        // For now, simpler to default 0 if empty.
        const val = value === "" ? 0 : parseFloat(value);
        setInputs(prev => ({ ...prev, [name]: val }));
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

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Calculator className="w-32 h-32 text-purple-900" />
            </div>

            <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 rounded-lg shadow-sm">
                    <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Müteahhit Hesabı (Kat Karşılığı)</h3>
                    <p className="text-xs text-gray-500">Gelişmiş Fizibilite Hesaplayıcı</p>
                </div>
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
                            <span className="text-sm font-medium">Verileri girip "Analiz Et" butonuna basın.</span>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
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

                            {/* Financial Details Tabs/Cards */}
                            <div className="space-y-4">
                                {/* Basic Cost/Rev */}
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

                                {/* Goodwill & Cash Flow (New) */}
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

                                {/* Proposal (New) */}
                                {result.teklif_ozeti && (
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <h4 className="font-bold text-blue-800 text-xs mb-2 uppercase tracking-wide">Arsa Sahibi Teklif Özeti</h4>
                                        <p className="text-xs text-blue-900 leading-relaxed font-medium">"{result.teklif_ozeti}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
}

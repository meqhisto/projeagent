"use client";

import { useState } from "react";
import { FileText, Calculator, X, Loader2 } from "lucide-react";

interface FeasibilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        arsaArea: number;
        ks: number;
        taks: number;
        height?: number;
    };
}

export default function FeasibilityModal({ isOpen, onClose, data }: FeasibilityModalProps) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/proxy/rag/feasibility", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    arsa_m2: data.arsaArea,
                    emsal_orani: data.ks,
                    taks_orani: data.taks,
                    kat_adedi: data.height ? data.height / 3 : 5, // Rough estimate if height missing
                    on_cekme: "5m", // Placeholder
                    yan_cekme: "3m",
                    arka_cekme: "3m"
                })
            });

            if (res.ok) {
                const result = await res.json();
                setReport(JSON.parse(result.report));
            }
        } catch (e) {
            console.error(e);
            alert("Analiz servisine erişilemedi.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Müteahhit Hesabı & Fizibilite</h3>
                            <p className="text-xs text-gray-500">Maksimum inşaat alanı simülasyonu</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!report ? (
                        <div className="text-center py-10">
                            <p className="text-gray-600 mb-6">
                                Mevcut parsel verileri ve bölge plan notları kullanılarak detaylı bir
                                <span className="font-bold text-gray-900"> "Maksimum Kullanılabilir Alan" </span>
                                analizi yapılacaktır.
                            </p>

                            <div className="grid grid-cols-3 gap-4 mb-8 text-sm text-gray-500">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="block font-bold text-gray-900">{data.arsaArea} m²</span>
                                    Arsa
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="block font-bold text-gray-900">{data.ks}</span>
                                    Emsal
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <span className="block font-bold text-gray-900">{data.taks}</span>
                                    TAKS
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />}
                                Analizi Başlat
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <span className="text-xs font-bold text-blue-400 uppercase">Yasal Emsal Hakkı</span>
                                    <p className="text-2xl font-bold text-blue-700">{report.yasal_emsal_hakki}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                    <span className="text-xs font-bold text-purple-400 uppercase">Satılabilir (Brüt)</span>
                                    <p className="text-2xl font-bold text-purple-700">{report.toplam_insaat_alani_brut}</p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700">Emsal Harici Kazanımlar (Bonuslar)</h4>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    <div className="flex justify-between p-3 text-sm">
                                        <span className="text-gray-600">Balkonlar</span>
                                        <span className="font-medium text-emerald-600">+{report.emsal_harici_kazanimlar.balkonlar_toplam}</span>
                                    </div>
                                    <div className="flex justify-between p-3 text-sm">
                                        <span className="text-gray-600">Ortak Alanlar</span>
                                        <span className="font-medium text-emerald-600">+{report.emsal_harici_kazanimlar.ortak_alanlar}</span>
                                    </div>
                                    <div className="flex justify-between p-3 text-sm">
                                        <span className="text-gray-600">Bodrum/Depo</span>
                                        <span className="font-medium text-gray-900">{report.emsal_harici_kazanimlar.bodrum_depo_vb}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg">
                                {report.ozet_yorum}
                            </div>

                            <button onClick={() => setReport(null)} className="w-full text-center text-sm text-gray-500 hover:text-gray-900 mt-4">
                                Yeni Analiz Yap
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

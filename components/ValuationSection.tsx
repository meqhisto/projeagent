"use client";

import { useState, useCallback } from "react";
import {
    TrendingUp, RefreshCw, ChevronDown, ChevronUp,
    AlertCircle, Info, ExternalLink
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ValuationMethod = "comparable_sales" | "zoning_based" | "hybrid";

interface Adjustment {
    factor: string;
    multiplier: number;
    description: string;
}

interface ComparableInfo {
    parcelId: number;
    title: string;
    pricePerM2: number;
    similarity: number;
    source: string;
}

interface ValuationResult {
    estimatedPricePerM2: number;
    estimatedTotalValue: number;
    confidenceScore: number;
    comparableCount: number;
    method: ValuationMethod;
    adjustments: Adjustment[];
    comparables: ComparableInfo[];
    rangeMin: number;
    rangeMax: number;
}

interface Props {
    parcelId: number;
    parcelArea: number | null;
    askingPrice?: number | null;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
});

function fmtTRY(v: number): string {
    return fmt.format(v);
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
    const { color, label } =
        score >= 70
            ? { color: "bg-green-100 text-green-700 border-green-200", label: "Yüksek Güven" }
            : score >= 40
            ? { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Orta Güven" }
            : { color: "bg-red-100 text-red-700 border-red-200", label: "Düşük Güven" };

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
            {label} — {score}/100
        </span>
    );
}

function MethodBadge({ method }: { method: ValuationMethod }) {
    const labels: Record<ValuationMethod, string> = {
        comparable_sales: "Emsal Satışlar",
        hybrid: "Hibrit",
        zoning_based: "İmar Bazlı",
    };
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {labels[method]}
        </span>
    );
}

function SourceBadge({ source }: { source: string }) {
    if (source.includes("sahibinden"))
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">sahibinden</span>;
    if (source.includes("hepsiemlak"))
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600">hepsiemlak</span>;
    if (source.includes("askingPrice"))
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600">ilan fiyatı</span>;
    return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">manuel</span>;
}

function RangeBar({
    min, max, estimate, asking
}: { min: number; max: number; estimate: number; asking?: number | null }) {
    if (min === 0 && max === 0) return null;
    const range = max - min;
    if (range <= 0) return null;

    const pct = (v: number) => clamp(((v - min) / range) * 100, 0, 100);
    const estimatePct = pct(estimate);
    const askingPct = asking ? pct(asking) : null;

    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{fmtTRY(min)}</span>
                <span className="font-medium text-slate-700">Tahmin Aralığı</span>
                <span>{fmtTRY(max)}</span>
            </div>
            <div className="relative h-3 bg-slate-100 rounded-full overflow-visible">
                <div
                    className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full"
                    style={{ width: "100%" }}
                />
                {/* Estimate marker */}
                <div
                    className="absolute -top-1 w-1.5 h-5 bg-[#0071e3] rounded-full shadow"
                    style={{ left: `${estimatePct}%`, transform: "translateX(-50%)" }}
                    title={`Tahmin: ${fmtTRY(estimate)}`}
                />
                {/* Asking price marker */}
                {askingPct !== null && (
                    <div
                        className="absolute -top-1 w-1.5 h-5 bg-purple-500 rounded-full shadow"
                        style={{ left: `${askingPct}%`, transform: "translateX(-50%)" }}
                        title={`İlan: ${fmtTRY(asking!)}`}
                    />
                )}
            </div>
            <div className="flex gap-4 mt-1.5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#0071e3]" />Tahmin</span>
                {askingPct !== null && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-purple-500" />İlan Fiyatı</span>}
            </div>
        </div>
    );
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, v));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ValuationSection({ parcelId, parcelArea, askingPrice }: Props) {
    const [valuation, setValuation] = useState<ValuationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdjustments, setShowAdjustments] = useState(false);
    const [showComparables, setShowComparables] = useState(false);

    const fetchValuation = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/parcels/${parcelId}/valuation`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Değerleme alınamadı");
            }
            setValuation(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [parcelId]);

    const askingDelta =
        valuation && askingPrice && valuation.estimatedTotalValue > 0
            ? ((askingPrice - valuation.estimatedTotalValue) / valuation.estimatedTotalValue) * 100
            : null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0071e3]" />
                    <h3 className="font-semibold text-slate-900">Tahmini Değerleme</h3>
                </div>
                <button
                    onClick={fetchValuation}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0071e3] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    {valuation ? "Yenile" : "Hesapla"}
                </button>
            </div>

            <div className="px-6 py-5">
                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Değerleme hesaplanamadı</p>
                            <p className="text-xs mt-0.5 opacity-80">{error}</p>
                            <button onClick={fetchValuation} className="text-xs underline mt-1">Tekrar dene</button>
                        </div>
                    </div>
                )}

                {/* Not yet fetched */}
                {!valuation && !loading && !error && (
                    <div className="text-center py-8 text-slate-400">
                        <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Bölgedeki benzer parsellerin verilerine göre tahmini piyasa değerini hesaplamak için &quot;Hesapla&quot; butonuna tıklayın.</p>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !valuation && (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-20 bg-slate-100 rounded-xl" />
                        <div className="h-10 bg-slate-100 rounded-xl" />
                        <div className="h-32 bg-slate-100 rounded-xl" />
                    </div>
                )}

                {/* Results */}
                {valuation && (
                    <div className="space-y-5">
                        {/* Zoning-based warning */}
                        {valuation.method === "zoning_based" && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p>Bu bölgede henüz yeterli emsal satış verisi yok. Tahmin imar parametreleri ve ulusal ortalamalar baz alınarak yapıldı.</p>
                            </div>
                        )}

                        {/* Metric cards */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* m² price */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
                                <p className="text-xs text-blue-600 font-medium mb-1">Tahmini m² Fiyatı</p>
                                <p className="text-xl font-bold text-blue-900">
                                    {fmtTRY(valuation.estimatedPricePerM2)}
                                </p>
                                <p className="text-[10px] text-blue-500 mt-1">/ m²</p>
                            </div>

                            {/* Total value */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                                <p className="text-xs text-slate-500 font-medium mb-1">Tahmini Toplam Değer</p>
                                <p className="text-xl font-bold text-slate-800">
                                    {parcelArea
                                        ? fmtTRY(valuation.estimatedTotalValue)
                                        : <span className="text-slate-400 text-base">Alan bilinmiyor</span>}
                                </p>
                                {parcelArea && (
                                    <p className="text-[10px] text-slate-400 mt-1">{parcelArea.toLocaleString("tr-TR")} m²</p>
                                )}
                            </div>

                            {/* Asking price comparison */}
                            <div className={`rounded-xl p-4 border ${askingDelta === null
                                ? "bg-slate-50 border-slate-200"
                                : askingDelta > 15
                                ? "bg-red-50 border-red-200"
                                : askingDelta < -5
                                ? "bg-green-50 border-green-200"
                                : "bg-amber-50 border-amber-200"
                            }`}>
                                <p className="text-xs text-slate-500 font-medium mb-1">İlan Fiyatı Kıyası</p>
                                {askingPrice ? (
                                    <>
                                        <p className="text-xl font-bold text-slate-800">{fmtTRY(askingPrice)}</p>
                                        {askingDelta !== null && (
                                            <p className={`text-xs font-medium mt-1 ${
                                                askingDelta > 15 ? "text-red-600"
                                                : askingDelta < -5 ? "text-green-600"
                                                : "text-amber-600"
                                            }`}>
                                                {askingDelta > 0 ? "+" : ""}{askingDelta.toFixed(1)}% tahmine göre
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-slate-400 text-sm mt-1">İlan fiyatı girilmemiş</p>
                                )}
                            </div>
                        </div>

                        {/* Range bar */}
                        {parcelArea && (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <RangeBar
                                    min={valuation.rangeMin}
                                    max={valuation.rangeMax}
                                    estimate={valuation.estimatedTotalValue}
                                    asking={askingPrice}
                                />
                            </div>
                        )}

                        {/* Confidence + method */}
                        <div className="flex flex-wrap items-center gap-2">
                            <ConfidenceBadge score={valuation.confidenceScore} />
                            <MethodBadge method={valuation.method} />
                            <span className="text-xs text-slate-400">{valuation.comparableCount} emsal kullanıldı</span>
                        </div>

                        {/* Adjustments (collapsible) */}
                        {valuation.adjustments.length > 0 && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowAdjustments(v => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <span>Düzeltme Faktörleri ({valuation.adjustments.length})</span>
                                    {showAdjustments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {showAdjustments && (
                                    <div className="divide-y divide-slate-100">
                                        {valuation.adjustments.map((adj, i) => (
                                            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                                <div>
                                                    <span className="font-mono text-xs text-slate-500">{adj.factor}</span>
                                                    <p className="text-slate-600 text-xs mt-0.5">{adj.description}</p>
                                                </div>
                                                <span className={`font-bold text-sm ml-4 flex-shrink-0 ${
                                                    adj.multiplier > 1 ? "text-green-600" : adj.multiplier < 1 ? "text-red-600" : "text-slate-500"
                                                }`}>
                                                    {adj.multiplier > 1 ? "+" : ""}{((adj.multiplier - 1) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Comparables table (collapsible) */}
                        {valuation.comparables.length > 0 && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowComparables(v => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <span>Kullanılan Emsaller ({valuation.comparables.length})</span>
                                    {showComparables ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {showComparables && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Emsal</th>
                                                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Kaynak</th>
                                                    <th className="text-right px-4 py-2 text-slate-500 font-medium">m² Fiyatı</th>
                                                    <th className="px-4 py-2 text-slate-500 font-medium">Benzerlik</th>
                                                    <th className="px-4 py-2" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {valuation.comparables.map((c, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-2.5 text-slate-700 max-w-[160px] truncate">{c.title}</td>
                                                        <td className="px-4 py-2.5"><SourceBadge source={c.source} /></td>
                                                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                                                            {fmtTRY(c.pricePerM2)}
                                                        </td>
                                                        <td className="px-4 py-2.5 w-28">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-[#0071e3] rounded-full"
                                                                        style={{ width: `${c.similarity}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-slate-500 w-8 text-right">{c.similarity.toFixed(0)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <a
                                                                href={`/parcels/${c.parcelId}`}
                                                                className="text-blue-500 hover:text-blue-700"
                                                                title="Parsele git"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Disclaimer */}
                        <p className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
                            Bu tahmin yalnızca bilgilendirme amaçlıdır. Resmi ekspertiz değildir. Piyasa koşullarına göre değişkenlik gösterebilir.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

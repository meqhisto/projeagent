"use client";

import { Calculator, TrendingUp, Building2 } from "lucide-react";

interface Props {
  area: number;
  ks: number;
  taks?: number | null;
  maxHeight?: number | null;
  zoningType?: string | null;
  askingPrice?: number | null;
}

export default function FeasibilityQuickCard({ area, ks, taks, maxHeight, zoningType, askingPrice }: Props) {
  const insaatAlani = area * ks;
  const tabanAlani = taks ? area * taks : null;
  const katSayisi = maxHeight ? Math.floor(maxHeight / 3) : null;
  const birimFiyat = askingPrice ? askingPrice / area : null;
  const tahminiInsaatDegeri = askingPrice ? insaatAlani * (birimFiyat! * 0.4) : null;

  const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(Math.round(n));
  const fmtPara = (n: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-[#0071e3] rounded-lg">
          <Calculator className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">Hızlı Fizibilite</h3>
        {zoningType && (
          <span className="ml-auto text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            {zoningType}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            İnşaat Alanı
          </div>
          <div className="text-xl font-black text-[#0071e3]">{fmt(insaatAlani)}</div>
          <div className="text-[10px] text-gray-400">m²  ({area} × {ks})</div>
        </div>

        {tabanAlani && (
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Taban Alanı</div>
            <div className="text-xl font-black text-gray-800">{fmt(tabanAlani)}</div>
            <div className="text-[10px] text-gray-400">m²  ({area} × {taks})</div>
          </div>
        )}

        {katSayisi && (
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tahmini Kat</div>
            <div className="text-xl font-black text-gray-800">{katSayisi}</div>
            <div className="text-[10px] text-gray-400">kat  (H={maxHeight}m / 3m)</div>
          </div>
        )}

        {birimFiyat && (
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Birim Fiyat
            </div>
            <div className="text-base font-black text-emerald-600">{fmt(birimFiyat)}</div>
            <div className="text-[10px] text-gray-400">TL/m²</div>
          </div>
        )}
      </div>

      {tahminiInsaatDegeri && (
        <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center">
          <span className="text-xs text-emerald-700">İnşaat sonrası tahmini satış potansiyeli</span>
          <span className="text-sm font-black text-emerald-700">{fmtPara(tahminiInsaatDegeri)}</span>
        </div>
      )}
    </div>
  );
}

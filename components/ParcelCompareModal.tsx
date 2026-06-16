"use client";

import { X, ArrowUpDown } from "lucide-react";

interface ZoningInfo {
  ks?: number | null;
  taks?: number | null;
  maxHeight?: number | null;
  zoningType?: string | null;
}

interface ParcelItem {
  id: number;
  city: string;
  district: string;
  neighborhood?: string;
  island: string;
  parsel: string;
  area?: number | null;
  askingPrice?: number | null;
  zoning?: ZoningInfo | null;
  category?: string | null;
  crmStage?: string | null;
}

interface Props {
  parcels: ParcelItem[];
  onClose: () => void;
}

const ROWS: { label: string; key: (p: ParcelItem) => string | number | null | undefined }[] = [
  { label: "İl", key: (p) => p.city },
  { label: "İlçe", key: (p) => p.district },
  { label: "Mahalle", key: (p) => p.neighborhood ?? "—" },
  { label: "Ada", key: (p) => p.island },
  { label: "Parsel", key: (p) => p.parsel },
  { label: "Alan (m²)", key: (p) => p.area ? new Intl.NumberFormat("tr-TR").format(p.area) : "—" },
  { label: "Fonksiyon", key: (p) => p.zoning?.zoningType ?? "—" },
  { label: "KAKS (Emsal)", key: (p) => p.zoning?.ks ?? "—" },
  { label: "TAKS", key: (p) => p.zoning?.taks ?? "—" },
  { label: "Hmax (m)", key: (p) => p.zoning?.maxHeight ?? "—" },
  {
    label: "İnşaat Alanı (m²)",
    key: (p) =>
      p.area && p.zoning?.ks
        ? new Intl.NumberFormat("tr-TR").format(Math.round(p.area * p.zoning.ks))
        : "—",
  },
  {
    label: "İlan Fiyatı",
    key: (p) =>
      p.askingPrice
        ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(p.askingPrice)
        : "—",
  },
  {
    label: "m² Birim Fiyat",
    key: (p) =>
      p.askingPrice && p.area
        ? new Intl.NumberFormat("tr-TR").format(Math.round(p.askingPrice / p.area)) + " TL/m²"
        : "—",
  },
];

function highlight(values: (string | number | null | undefined)[], idx: number): boolean {
  const nums = values.map((v) => (typeof v === "string" ? parseFloat(v.replace(/\./g, "").replace(",", ".")) : v));
  if (nums.some((n) => isNaN(n as number) || n === null || n === undefined)) return false;
  const val = nums[idx] as number;
  const max = Math.max(...(nums as number[]));
  return val === max && max > 0;
}

export default function ParcelCompareModal({ parcels, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-[#0071e3]" />
            <h2 className="text-lg font-bold text-gray-900">Parsel Karşılaştırma</h2>
            <span className="text-xs font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
              {parcels.length} parsel
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 p-5">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider pb-3 pr-4 sticky left-0 bg-white w-36">
                  Özellik
                </th>
                {parcels.map((p) => (
                  <th key={p.id} className="text-center pb-3 px-3 min-w-[140px]">
                    <a
                      href={`/parcels/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[#0071e3] font-bold hover:underline"
                    >
                      {p.island}/{p.parsel}
                    </a>
                    <div className="text-[10px] text-gray-400 font-normal">{p.city} · {p.district}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ label, key }, rowIdx) => {
                const values = parcels.map(key);
                return (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-gray-50/50" : ""}>
                    <td className="text-xs text-gray-500 font-semibold pr-4 py-2.5 sticky left-0 bg-inherit">
                      {label}
                    </td>
                    {values.map((val, colIdx) => {
                      const isTop = highlight(values, colIdx);
                      return (
                        <td
                          key={colIdx}
                          className={`text-center py-2.5 px-3 rounded-lg font-semibold text-gray-800 text-sm ${
                            isTop ? "bg-emerald-50 text-emerald-700" : ""
                          }`}
                        >
                          {val ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          Yeşil hücreler o satırdaki en yüksek değeri gösterir
        </div>
      </div>
    </div>
  );
}

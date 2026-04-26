"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, TrendingUp, Users, Target, DollarSign, Building2, CheckCircle, ArrowRight } from "lucide-react";
import AddParcelDrawer from "@/components/AddParcelDrawer";
import KPICard from "@/components/KPICard";
import PipelineChart from "@/components/PipelineChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";
import HotLeadsList from "@/components/HotLeadsList";
import ParcelCard from "@/components/ParcelCard";
import AdvancedFilterPanel from "@/components/AdvancedFilterPanel";
import ExportButton from "@/components/ExportButton";
import TaskWidget from "@/components/TaskWidget";
import Link from "next/link";
import { Parcel } from "@/types";

interface KpiData {
  totalParcels: number;
  activeParcels: number;
  conversionRate: number;
  avgROI: number;
  thisMonthAdded: number;
  totalValue: number;
  trends: {
    parcels: number;
    roi: number;
  };
}

export default function Home() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filters, setFilters] = useState<any>({});

  const fetchParcels = async () => {
    try {
      const res = await fetch("/api/parcels");
      if (res.ok) {
        const data = await res.json();
        setParcels(data);
      }
    } catch (error) {
      console.error("Failed to fetch parcels", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [kpisRes, pipelineRes, monthlyRes] = await Promise.all([
        fetch("/api/analytics/kpis"),
        fetch("/api/analytics/pipeline"),
        fetch("/api/analytics/monthly-trend")
      ]);

      if (kpisRes.ok) setKpis(await kpisRes.json());
      if (pipelineRes.ok) setPipelineData(await pipelineRes.json());
      if (monthlyRes.ok) setMonthlyData(await monthlyRes.json());
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchParcels(), fetchAnalytics()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Apply filters
  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      if (filters.city && p.city !== filters.city) return false;
      if (filters.district && !p.district?.toLowerCase().includes(filters.district.toLowerCase())) return false;
      if (filters.areaMin && (!p.area || p.area < parseFloat(filters.areaMin))) return false;
      if (filters.areaMax && (!p.area || p.area > parseFloat(filters.areaMax))) return false;
      if (filters.crmStages?.length > 0 && !filters.crmStages.includes(p.crmStage || 'NEW_LEAD')) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.hasZoning === "true" && !p.zoning) return false;
      if (filters.hasZoning === "false" && p.zoning) return false;
      return true;
    });
  }, [parcels, filters]);

  const availableCities = useMemo(() => {
    return Array.from(new Set(parcels.map(p => p.city))).sort();
  }, [parcels]);

  const hotLeads = useMemo(() => {
    return filteredParcels
      .filter(p => p.area && p.area > 1000)
      .slice(0, 5)
      .map(p => ({
        ...p,
        area: p.area ?? undefined,
        roi: (p.id * 7) % 20 + 20 // Deterministic placeholder ROI instead of random
      }));
  }, [filteredParcels]);

  const recentParcels = filteredParcels.slice(0, 8);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1d1d1f] tracking-tight font-display">Dashboard</h1>
          <p className="text-[15px] text-[#6e6e73] mt-2 font-medium">Parsel yönetimi ve analiz merkezi</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdvancedFilterPanel
            onFilterChange={setFilters}
            availableCities={availableCities}
          />
          <ExportButton parcels={filteredParcels} />
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center rounded-xl bg-[#0071e3] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Yeni Parsel Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard
            title="Toplam Parsel"
            value={kpis.totalParcels}
            icon={Building2}
            trend={`%${kpis.trends.parcels}`}
            color="blue"
          />
          <KPICard
            title="Aktif Fırsatlar"
            value={kpis.activeParcels}
            icon={Target}
            color="purple"
          />
          <KPICard
            title="Dönüşüm Oranı"
            value={`%${kpis.conversionRate}`}
            icon={CheckCircle}
            trend={`%${kpis.trends.roi}`}
            color="green"
          />
          <KPICard
            title="Ortalama ROI"
            value={`%${kpis.avgROI}`}
            icon={TrendingUp}
            color="yellow"
          />
          <KPICard
            title="Bu Ay Eklenen"
            value={kpis.thisMonthAdded}
            icon={Users}
            color="indigo"
          />
          <KPICard
            title="Toplam Değer"
            value={`₺${(kpis.totalValue / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            color="pink"
          />
        </div>
      )}

      {/* Charts & Tasks Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <PipelineChart data={pipelineData} />
        <MonthlyTrendChart data={monthlyData} />
        <TaskWidget />
      </div>

      {/* Hot Leads */}
      {hotLeads.length > 0 && (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Önemli Fırsatlar</h3>
            </div>
            <HotLeadsList parcels={hotLeads} />
        </div>
      )}

      {/* Recent Parcels */}
      {recentParcels.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
            <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight font-display">
              {Object.keys(filters).some(k => filters[k] && (Array.isArray(filters[k]) ? filters[k].length > 0 : true))
                ? 'Filtrelenmiş Parseller'
                : 'Son Eklenen Parseller'}
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-[#6e6e73] font-medium bg-white px-3 py-1 rounded-full border border-black/[0.04] shadow-sm">
                {filteredParcels.length} sonuç
              </span>
              <Link href="/parcels" className="text-[13px] font-semibold text-[#0071e3] hover:text-[#0077ed] flex items-center gap-1 group">
                Tümünü Gör
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentParcels.map((parcel) => (
              <ParcelCard
                key={parcel.id}
                id={parcel.id}
                city={parcel.city}
                district={parcel.district}
                island={parcel.island}
                parcel={parcel.parsel}
                status={parcel.status}
                imageUrl={parcel.images && parcel.images.length > 0 ? parcel.images[0].url : undefined}
                zoning={parcel.zoning}
                category={parcel.category}
                tags={parcel.tags}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && parcels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-md rounded-[32px] border border-dashed border-black/[0.06] text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-slate-300" />
            </div>
          <h3 className="text-lg font-semibold text-[#1d1d1f]">Henüz takip edilen parsel yok</h3>
          <p className="mt-2 text-[14px] text-[#6e6e73] max-w-sm mx-auto leading-relaxed">Yeni bir parsel ekleyerek portföyünüzü oluşturmaya ve analiz etmeye başlayın.</p>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="mt-6 text-[14px] font-semibold text-[#0071e3] hover:text-[#0077ed]"
          >
            Hemen Ekle →
          </button>
        </div>
      )}

      <AddParcelDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchParcels}
      />
    </div>
  );
}

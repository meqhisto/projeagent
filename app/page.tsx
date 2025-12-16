"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, TrendingUp, Users, Target, DollarSign, Building2, CheckCircle } from "lucide-react";
import AddParcelModal from "@/components/AddParcelModal";
import KPICard from "@/components/KPICard";
import PipelineChart from "@/components/PipelineChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";
import HotLeadsList from "@/components/HotLeadsList";
import ParcelCard from "@/components/ParcelCard";
import AdvancedFilterPanel from "@/components/AdvancedFilterPanel";
import ExportButton from "@/components/ExportButton";

export default function Home() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    // Auto-refresh removed - user can manually refresh if needed
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

  const hotLeads = filteredParcels
    .filter(p => p.area && p.area > 1000)
    .slice(0, 5)
    .map(p => ({
      ...p,
      roi: Math.floor(Math.random() * 20) + 20 // Placeholder ROI
    }));

  const recentParcels = filteredParcels.slice(0, 6);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Parsel yönetimi ve analiz merkezi</p>
        </div>
        <div className="flex items-center gap-3">
          <AdvancedFilterPanel
            onFilterChange={setFilters}
            availableCities={availableCities}
          />
          <ExportButton parcels={filteredParcels} />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Parsel Ekle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            title="Toplam Parsel"
            value={kpis.totalParcels}
            icon={Building2}
            trend={kpis.trends.parcels}
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
            trend={kpis.trends.roi}
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

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PipelineChart data={pipelineData} />
        <MonthlyTrendChart data={monthlyData} />
      </div>

      {/* Hot Leads */}
      {hotLeads.length > 0 && (
        <HotLeadsList parcels={hotLeads} />
      )}

      {/* Recent Parcels */}
      {recentParcels.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {Object.keys(filters).some(k => filters[k] && (Array.isArray(filters[k]) ? filters[k].length > 0 : true))
                ? 'Filtrelenmiş Parseller'
                : 'Son Eklenen Parseller'}
            </h3>
            <span className="text-sm text-gray-500">
              {filteredParcels.length} sonuç
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              />
            ))}
          </div>
        </div>
      )}

      {!loading && parcels.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900">Henüz takip edilen parsel yok</h3>
          <p className="mt-1 text-sm text-gray-500">Yeni bir parsel ekleyerek analize başlayın.</p>
        </div>
      )}

      <AddParcelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchParcels}
      />
    </div>
  );
}

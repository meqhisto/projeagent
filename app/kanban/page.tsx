"use client";

import { useState, useEffect } from "react";
import { Layers, Search, MapPin } from "lucide-react";
import Link from "next/link";

const STAGES = [
    { id: "NEW_LEAD", name: "Yeni Fırsat", color: "blue" },
    { id: "CONTACTED", name: "İletişimde", color: "purple" },
    { id: "ANALYSIS", name: "Analiz", color: "yellow" },
    { id: "OFFER_SENT", name: "Teklif Gönderildi", color: "indigo" },
    { id: "CONTRACT", name: "Sözleşme", color: "green" },
    { id: "LOST", name: "Kayıp", color: "gray" }
];

export default function KanbanPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("NEW_LEAD");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchParcels();
    }, []);

    const fetchParcels = async () => {
        try {
            const res = await fetch("/api/parcels");
            if (res.ok) {
                const data = await res.json();
                setParcels(data);
            }
        } catch (error) {
            console.error("Fetch parcels error:", error);
        } finally {
            setLoading(false);
        }
    };

    const moveParcel = async (parcelId: number, newStage: string) => {
        setParcels(prev => prev.map(p =>
            p.id === parcelId ? { ...p, crmStage: newStage } : p
        ));

        try {
            await fetch(`/api/parcels/${parcelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crmStage: newStage })
            });
        } catch (error) {
            console.error("Update stage error:", error);
            fetchParcels();
        }
    };

    const getParcelsByStage = (stageId: string) => {
        return parcels.filter(p => {
            const matchesStage = (p.crmStage || "NEW_LEAD") === stageId;
            const matchesSearch = searchTerm === "" ||
                p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.island?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.parcel?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStage && matchesSearch;
        });
    };

    const getStageColor = (color: string, active: boolean) => {
        const colors: any = {
            blue: active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100",
            purple: active ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100",
            yellow: active ? "bg-yellow-600 text-white" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
            indigo: active ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
            green: active ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100",
            gray: active ? "bg-gray-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        };
        return colors[color] || colors.blue;
    };

    const activeStageParcels = getParcelsByStage(activeTab);
    const activeStageInfo = STAGES.find(s => s.id === activeTab);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden">
            {/* Page Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0">
                        <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">İş Akışı</h1>
                        <p className="text-xs text-gray-500 hidden sm:block">Parsel CRM Pipeline</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:flex-none sm:w-40">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ara..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="text-xs text-gray-600 hidden sm:block whitespace-nowrap">
                        <span className="font-bold">{parcels.length}</span> Parsel
                    </div>
                </div>
            </div>

            {/* Tabs - horizontal scroll on mobile */}
            <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm -mx-1 px-1">
                <div className="flex gap-1 p-2 min-w-min">
                    {STAGES.map(stage => {
                        const count = getParcelsByStage(stage.id).length;
                        const isActive = activeTab === stage.id;
                        return (
                            <button
                                key={stage.id}
                                onClick={() => setActiveTab(stage.id)}
                                className={`${getStageColor(stage.color, isActive)} px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0`}
                            >
                                <span className="hidden sm:inline">{stage.name}</span>
                                <span className="sm:hidden">{stage.name.split(' ')[0]}</span>
                                <span className={`${isActive ? 'bg-white/20' : 'bg-black/10'} px-1.5 py-0.5 rounded-full text-xs font-bold`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="w-full">
                {activeStageParcels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {activeStageParcels.map(parcel => (
                            <div
                                key={parcel.id}
                                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-200 group"
                            >
                                <Link href={`/parcels/${parcel.id}`} className="block">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                                {parcel.city} / {parcel.district}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {parcel.neighborhood}
                                            </p>
                                        </div>
                                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                    </div>

                                    <div className="space-y-1.5 mb-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Ada / Parsel</span>
                                            <span className="font-medium text-gray-900">{parcel.island} / {parcel.parsel}</span>
                                        </div>
                                        {parcel.area && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Alan</span>
                                                <span className="font-medium text-gray-900">{parcel.area} m²</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${parcel.status === 'COMPLETED' ? 'bg-emerald-100 text-[#0077ed]' :
                                            parcel.status === 'RESEARCHING' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {parcel.status}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(parcel.createdAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                </Link>

                                {/* Stage Move Dropdown */}
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-gray-500">Aşama:</span>
                                        <select
                                            value={parcel.crmStage || "NEW_LEAD"}
                                            onChange={(e) => moveParcel(parcel.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 max-w-[140px]"
                                        >
                                            {STAGES.map(stage => (
                                                <option key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 px-4">
                        <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900 mb-1">
                            {activeStageInfo?.name} - Boş
                        </h3>
                        <p className="text-xs text-gray-500">
                            {searchTerm ? "Sonuç bulunamadı" : "Henüz parsel yok"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

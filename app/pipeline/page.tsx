"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { Loader2, Plus, MapPin, Building2 } from "lucide-react";

interface PipelineParcel {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    island: string;
    parsel: string;
    area: number;
    crmStage: string;
    zoning: { zoningType: string; ks: number } | null;
}

interface PipelineProperty {
    id: number;
    title: string;
    type: string;
    city: string;
    district: string;
    neighborhood: string;
    grossArea: number | null;
    netArea: number | null;
    listingPrice: number | null;
    crmStage: string;
    roomType: string | null;
}

const PARCEL_STAGES = {
    "NEW_LEAD":   { label: "Yeni Fırsat",        color: "bg-blue-50 border-blue-200 text-blue-700" },
    "CONTACTED":  { label: "Görüşülüyor",         color: "bg-amber-50 border-amber-200 text-amber-700" },
    "ANALYSIS":   { label: "Analiz Yapıldı",      color: "bg-purple-50 border-purple-200 text-purple-700" },
    "OFFER_SENT": { label: "Teklif Verildi",      color: "bg-orange-50 border-orange-200 text-orange-700" },
    "CONTRACT":   { label: "Sözleşme / Kapora",   color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    "LOST":       { label: "Kaybedildi",           color: "bg-gray-50 border-gray-200 text-gray-500" },
};

const PROPERTY_STAGES = {
    "LISTING":     { label: "İlan Aşamasında",    color: "bg-blue-50 border-blue-200 text-blue-700" },
    "SHOWING":     { label: "Gösterim Yapılıyor", color: "bg-amber-50 border-amber-200 text-amber-700" },
    "NEGOTIATING": { label: "Müzakere",            color: "bg-purple-50 border-purple-200 text-purple-700" },
    "CONTRACT":    { label: "Sözleşme",            color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    "CLOSED":      { label: "Kapandı",             color: "bg-gray-100 border-gray-300 text-gray-600" },
    "CANCELLED":   { label: "İptal",               color: "bg-red-50 border-red-200 text-red-500" },
};

const formatCurrency = (v: number | null) => v
    ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v)
    : null;

export default function PipelinePage() {
    const [mode, setMode] = useState<"parcels" | "properties">("parcels");
    const [parcelColumns, setParcelColumns] = useState<Record<string, PipelineParcel[]>>({});
    const [propertyColumns, setPropertyColumns] = useState<Record<string, PipelineProperty[]>>({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"fit" | "scroll">("fit");

    useEffect(() => {
        if (mode === "parcels") fetchParcels();
        else fetchProperties();
    }, [mode]);

    const fetchParcels = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/parcels");
            const data = await res.json();
            const grouped: Record<string, PipelineParcel[]> = Object.fromEntries(
                Object.keys(PARCEL_STAGES).map(k => [k, []])
            );
            const parcels = Array.isArray(data) ? data : (data.parcels || []);
            parcels.forEach((p: any) => {
                const stage = p.crmStage || "NEW_LEAD";
                if (grouped[stage]) grouped[stage].push(p);
                else grouped["NEW_LEAD"].push(p);
            });
            setParcelColumns(grouped);
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/properties");
            const data = await res.json();
            const grouped: Record<string, PipelineProperty[]> = Object.fromEntries(
                Object.keys(PROPERTY_STAGES).map(k => [k, []])
            );
            (data as PipelineProperty[]).forEach((p) => {
                const stage = p.crmStage || "LISTING";
                if (grouped[stage]) grouped[stage].push(p);
                else grouped["LISTING"].push(p);
            });
            setPropertyColumns(grouped);
        } finally {
            setLoading(false);
        }
    };

    const onParcelDragEnd = async (result: any) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        const parcelId = parseInt(draggableId);
        const newStage = destination.droppableId;

        const src = [...parcelColumns[source.droppableId]];
        const dst = [...parcelColumns[destination.droppableId]];
        const [moved] = src.splice(source.index, 1);
        moved.crmStage = newStage;
        dst.splice(destination.index, 0, moved);
        setParcelColumns({ ...parcelColumns, [source.droppableId]: src, [destination.droppableId]: dst });

        try {
            await fetch(`/api/parcels/${parcelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crmStage: newStage }),
            });
        } catch {
            fetchParcels();
        }
    };

    const onPropertyDragEnd = async (result: any) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        const propertyId = parseInt(draggableId);
        const newStage = destination.droppableId;

        const src = [...propertyColumns[source.droppableId]];
        const dst = [...propertyColumns[destination.droppableId]];
        const [moved] = src.splice(source.index, 1);
        moved.crmStage = newStage;
        dst.splice(destination.index, 0, moved);
        setPropertyColumns({ ...propertyColumns, [source.droppableId]: src, [destination.droppableId]: dst });

        try {
            await fetch(`/api/properties/${propertyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crmStage: newStage }),
            });
        } catch {
            fetchProperties();
        }
    };

    const stages = mode === "parcels" ? PARCEL_STAGES : PROPERTY_STAGES;
    const columns = mode === "parcels" ? parcelColumns : propertyColumns;

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-[#0071e3]" />
        </div>
    );

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Satış Boru Hattı</h1>

                    {/* Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setMode("parcels")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "parcels" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            Arsalar
                        </button>
                        <button
                            onClick={() => setMode("properties")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "properties" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <Building2 className="h-3.5 w-3.5" />
                            Gayrimenkuller
                        </button>
                    </div>

                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("fit")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "fit" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Sığdır
                        </button>
                        <button
                            onClick={() => setViewMode("scroll")}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "scroll" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Genişlet
                        </button>
                    </div>
                </div>

                <Link
                    href={mode === "parcels" ? "/" : "/properties"}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {mode === "parcels" ? "Yeni Parsel" : "Yeni Gayrimenkul"}
                </Link>
            </div>

            <DragDropContext onDragEnd={mode === "parcels" ? onParcelDragEnd : onPropertyDragEnd}>
                <div className={`flex-1 ${viewMode === "scroll" ? "overflow-x-auto" : "overflow-hidden"}`}>
                    <div className={`flex h-full gap-3 p-4 ${viewMode === "scroll" ? "min-w-max" : ""}`}>
                        {Object.entries(stages).map(([stageKey, stageConfig]) => (
                            <div
                                key={stageKey}
                                className={`flex flex-col rounded-xl bg-gray-50/50 border border-gray-100 shadow-sm max-h-full ${viewMode === "fit" ? "flex-1 min-w-0" : "w-80"}`}
                            >
                                <div className={`p-4 font-bold border-b ${stageConfig.color} bg-white rounded-t-xl flex justify-between items-center`}>
                                    <span className="text-sm">{stageConfig.label}</span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                                        {columns[stageKey]?.length || 0}
                                    </span>
                                </div>

                                <Droppable droppableId={stageKey}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="p-3 flex-1 overflow-y-auto space-y-3"
                                        >
                                            {mode === "parcels"
                                                ? columns[stageKey]?.map((parcel: any, index: number) => (
                                                    <Draggable key={parcel.id} draggableId={parcel.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{parcel.neighborhood}</h4>
                                                                    <Link href={`/parcels/${parcel.id}`} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
                                                                        <MapPin className="h-3 w-3 text-gray-400" />
                                                                    </Link>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mb-3 space-y-1">
                                                                    <p>{parcel.city} / {parcel.district}</p>
                                                                    <p>Ada: {parcel.island} | Parsel: {parcel.parsel}</p>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                                    <span className="text-xs font-medium text-[#0071e3] bg-[#0071e3]/10 px-2 py-1 rounded">
                                                                        {parcel.area ? `${parcel.area} m²` : '-'}
                                                                    </span>
                                                                    {parcel.zoning?.ks && (
                                                                        <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                                                                            E: {parcel.zoning.ks}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                                : columns[stageKey]?.map((prop: any, index: number) => (
                                                    <Draggable key={prop.id} draggableId={prop.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{prop.title}</h4>
                                                                    <Link href={`/properties/${prop.id}`} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
                                                                        <Building2 className="h-3 w-3 text-gray-400" />
                                                                    </Link>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mb-3 space-y-1">
                                                                    <p>{prop.city} / {prop.district}</p>
                                                                    {prop.roomType && <p>{prop.roomType.replace(/_/g, '+').replace('PLUS', '+')} • {prop.type}</p>}
                                                                </div>
                                                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                                    {prop.grossArea && (
                                                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                            {prop.grossArea} m²
                                                                        </span>
                                                                    )}
                                                                    {prop.listingPrice && (
                                                                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                                            {formatCurrency(prop.listingPrice)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                            }
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
}

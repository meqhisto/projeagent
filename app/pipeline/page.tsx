"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Link from "next/link";
import { Loader2, Plus, MapPin } from "lucide-react";

interface PipelineParcel {
    id: number;
    city: string;
    district: string;
    neighborhood: string;
    island: string;
    parcel: string;
    area: number;
    crmStage: string;
    zoning: {
        zoningType: string;
        ks: number;
    } | null;
}

const STAGES = {
    "NEW_LEAD": { label: "Yeni Fırsat", color: "bg-blue-50 border-blue-200 text-blue-700" },
    "CONTACTED": { label: "Görüşülüyor", color: "bg-amber-50 border-amber-200 text-amber-700" },
    "ANALYSIS": { label: "Analiz Yapıldı", color: "bg-purple-50 border-purple-200 text-purple-700" },
    "OFFER_SENT": { label: "Teklif Verildi", color: "bg-orange-50 border-orange-200 text-orange-700" },
    "CONTRACT": { label: "Sözleşme / Kapora", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    "LOST": { label: "Kaybedildi", color: "bg-gray-50 border-gray-200 text-gray-500" }
};

export default function PipelinePage() {
    const [columns, setColumns] = useState<Record<string, PipelineParcel[]>>({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"fit" | "scroll">("fit");

    useEffect(() => {
        fetchPipeline();
    }, []);

    // ... (fetchPipeline and onDragEnd same as before)
    const fetchPipeline = async () => {
        try {
            const res = await fetch("/api/parcels"); // We need to filter/sort this
            const data = await res.json();

            // Group by stage
            const grouped: Record<string, PipelineParcel[]> = {
                "NEW_LEAD": [], "CONTACTED": [], "ANALYSIS": [],
                "OFFER_SENT": [], "CONTRACT": [], "LOST": []
            };

            data.forEach((p: any) => {
                const stage = p.crmStage || "NEW_LEAD";
                if (grouped[stage]) grouped[stage].push(p);
                else grouped["NEW_LEAD"].push(p); // Fallback
            });

            setColumns(grouped);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        const parcelId = parseInt(draggableId);
        const newStage = destination.droppableId;

        if (source.droppableId === destination.droppableId) return;

        // Optimistic UI Update
        const sourceCol = [...columns[source.droppableId]];
        const destCol = [...columns[destination.droppableId]];
        const [movedItem] = sourceCol.splice(source.index, 1);

        movedItem.crmStage = newStage;
        destCol.splice(destination.index, 0, movedItem);

        setColumns({
            ...columns,
            [source.droppableId]: sourceCol,
            [destination.droppableId]: destCol
        });

        // Backend Update
        try {
            await fetch(`/api/parcels/${parcelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crmStage: newStage })
            });
        } catch (e) {
            console.error(e);
            alert("Taşıma sırasında hata oluştu!");
            fetchPipeline(); // Revert
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Satış Boru Hattı</h1>
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
                <Link href="/" className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> Yeni Parsel
                </Link>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className={`flex-1 ${viewMode === "scroll" ? "overflow-x-auto" : "overflow-hidden"}`}>
                    <div className={`flex h-full gap-3 p-4 ${viewMode === "scroll" ? "min-w-max" : ""}`}>
                        {Object.entries(STAGES).map(([stageKey, stageConfig]) => (
                            <div
                                key={stageKey}
                                className={`flex flex-col rounded-xl bg-gray-50/50 border border-gray-100 shadow-sm max-h-full 
                                    ${viewMode === "fit" ? "flex-1 min-w-0" : "w-80"}`}
                            >
                                {/* Column Header */}
                                <div className={`p-4 font-bold border-b ${stageConfig.color} bg-white rounded-t-xl flex justify-between items-center`}>
                                    <span>{stageConfig.label}</span>
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
                                            {columns[stageKey]?.map((parcel, index) => (
                                                <Draggable key={parcel.id} draggableId={parcel.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                                                                    {parcel.neighborhood}
                                                                </h4>
                                                                <Link href={`/parcels/${parcel.id}`} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
                                                                    <MapPin className="h-3 w-3 text-gray-400" />
                                                                </Link>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mb-3 space-y-1">
                                                                <p>{parcel.city} / {parcel.district}</p>
                                                                <p>Ada: {parcel.island} | Parsel: {parcel.parsel}</p>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
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
                                            ))}
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

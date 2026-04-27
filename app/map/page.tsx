"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
    MapPin, Filter, Loader2, Layers, Search, X,
    ChevronDown, Pencil, Crosshair, Info, LayoutGrid,
    ExternalLink, Tag, Ruler, Building2, TrendingUp,
    Download, Trash2, CheckCircle2, AlertCircle, FolderOpen,
} from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_LABELS, STAGE_COLORS, TILE_LAYERS } from "./MapView";

const STAGE_NAMES: Record<string, string> = {
    NEW_LEAD: "Yeni Fırsat",
    CONTACTED: "İletişimde",
    ANALYSIS: "Analiz",
    OFFER_SENT: "Teklif Gönderildi",
    CONTRACT: "Sözleşme",
    LOST: "Kayıp",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

// Dynamic map — loaded only on client
const MapView = dynamic(() => import("./MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    ),
});

interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export default function MapPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedParcel, setSelectedParcel] = useState<any | null>(null);
    const [selectedStages, setSelectedStages] = useState<string[]>(Object.keys(STAGE_NAMES));
    const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORIES);
    const [layerType, setLayerType] = useState<"street" | "satellite" | "terrain">("street");
    const [clustered, setClustered] = useState(true);
    const [isDrawing, setIsDrawing] = useState(false);
    const [pickingCoords, setPickingCoords] = useState(false);
    const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
    const [drawnShapes, setDrawnShapes] = useState<any[]>([]);
    const [geometryLoading, setGeometryLoading] = useState(false);
    const [geometryStatus, setGeometryStatus] = useState<"idle" | "ok" | "error">("idle");
    const [lastDrawnGeometry, setLastDrawnGeometry] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter panel
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetch("/api/parcels")
            .then((r) => r.json())
            .then((data) => setParcels(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Close search dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleStage = useCallback((stage: string) => {
        setSelectedStages((prev) =>
            prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
        );
    }, []);

    const toggleCategory = useCallback((cat: string) => {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    }, []);

    const filteredParcels = useMemo(
        () =>
            parcels.filter(
                (p) =>
                    (p.latitude || p.geometry) &&
                    selectedStages.includes(p.crmStage || "NEW_LEAD") &&
                    selectedCategories.includes(p.category || "UNCATEGORIZED")
            ),
        [parcels, selectedStages, selectedCategories]
    );

    const mapCenter = useMemo<[number, number]>(() => {
        if (filteredParcels.length === 0) return [39.9334, 32.8597];
        const lat = filteredParcels.reduce((s, p) => s + p.latitude, 0) / filteredParcels.length;
        const lng = filteredParcels.reduce((s, p) => s + p.longitude, 0) / filteredParcels.length;
        return [lat, lng];
    }, [filteredParcels]);

    // Nominatim address search
    const handleSearch = useCallback((q: string) => {
        setSearchQuery(q);
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!q.trim()) { setSearchResults([]); return; }
        searchDebounce.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=tr`,
                    { headers: { "Accept-Language": "tr" } }
                );
                const data = await res.json();
                setSearchResults(data);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 400);
    }, []);

    const handleSelectResult = useCallback((result: SearchResult) => {
        setFlyTo({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), zoom: 14 });
        setSearchQuery(result.display_name.split(",")[0]);
        setSearchResults([]);
    }, []);

    const handlePickCoords = useCallback((lat: number, lng: number) => {
        setPickedCoords({ lat, lng });
        setPickingCoords(false);
    }, []);

    const handleDrawn = useCallback((geoJson: any) => {
        setDrawnShapes((prev) => [...prev, geoJson]);
        setLastDrawnGeometry(geoJson.geometry);
    }, []);

    // Fetch parcel geometry from TKGM
    const handleFetchGeometry = useCallback(async (parcel: any) => {
        setGeometryLoading(true);
        setGeometryStatus("idle");
        try {
            const res = await fetch(`/api/parcels/${parcel.id}/geometry`);
            const data = await res.json();
            if (data.geometry) {
                setParcels((prev) =>
                    prev.map((p) =>
                        p.id === parcel.id
                            ? { ...p, geometry: JSON.stringify(data.geometry) }
                            : p
                    )
                );
                setSelectedParcel((prev: any) =>
                    prev?.id === parcel.id
                        ? { ...prev, geometry: JSON.stringify(data.geometry) }
                        : prev
                );
                setGeometryStatus("ok");
            } else {
                setGeometryStatus("error");
            }
        } catch {
            setGeometryStatus("error");
        } finally {
            setGeometryLoading(false);
        }
    }, []);

    // Save last drawn geometry to selected parcel
    const handleSaveDrawnGeometry = useCallback(async () => {
        if (!selectedParcel || !lastDrawnGeometry) return;
        setGeometryLoading(true);
        try {
            await fetch(`/api/parcels/${selectedParcel.id}/geometry`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geometry: lastDrawnGeometry }),
            });
            setParcels((prev) =>
                prev.map((p) =>
                    p.id === selectedParcel.id
                        ? { ...p, geometry: JSON.stringify(lastDrawnGeometry) }
                        : p
                )
            );
            setSelectedParcel((prev: any) =>
                prev ? { ...prev, geometry: JSON.stringify(lastDrawnGeometry) } : prev
            );
            setLastDrawnGeometry(null);
            setGeometryStatus("ok");
        } catch {
            setGeometryStatus("error");
        } finally {
            setGeometryLoading(false);
        }
    }, [selectedParcel, lastDrawnGeometry]);

    // Inline category update
    const handleCategoryChange = useCallback(async (parcel: any, newCategory: string) => {
        await fetch(`/api/parcels/${parcel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory }),
        });
        setParcels((prev) =>
            prev.map((p) => p.id === parcel.id ? { ...p, category: newCategory } : p)
        );
        setSelectedParcel((prev: any) =>
            prev?.id === parcel.id ? { ...prev, category: newCategory } : prev
        );
    }, []);

    // Delete geometry from parcel
    const handleDeleteGeometry = useCallback(async (parcel: any) => {
        try {
            await fetch(`/api/parcels/${parcel.id}/geometry`, { method: "DELETE" });
            setParcels((prev) =>
                prev.map((p) => p.id === parcel.id ? { ...p, geometry: null } : p)
            );
            setSelectedParcel((prev: any) =>
                prev?.id === parcel.id ? { ...prev, geometry: null } : prev
            );
        } catch {}
    }, []);

    // Import TKGM JSON file
    const handleImportJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedParcel) return;
        e.target.value = "";

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);

                // Support both FeatureCollection and single Feature
                let geometry: any = null;
                if (json.type === "FeatureCollection" && json.features?.length > 0) {
                    // Merge multiple features into MultiPolygon if needed
                    if (json.features.length === 1) {
                        geometry = json.features[0].geometry;
                    } else {
                        geometry = {
                            type: "MultiPolygon",
                            coordinates: json.features
                                .filter((f: any) => f.geometry?.type === "Polygon")
                                .map((f: any) => f.geometry.coordinates),
                        };
                    }
                } else if (json.type === "Feature") {
                    geometry = json.geometry;
                } else if (json.type === "Polygon" || json.type === "MultiPolygon") {
                    geometry = json;
                }

                if (!geometry) {
                    setGeometryStatus("error");
                    return;
                }

                setGeometryLoading(true);
                await fetch(`/api/parcels/${selectedParcel.id}/geometry`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ geometry }),
                });

                const geomStr = JSON.stringify(geometry);
                setParcels((prev) =>
                    prev.map((p) => p.id === selectedParcel.id ? { ...p, geometry: geomStr } : p)
                );
                setSelectedParcel((prev: any) =>
                    prev ? { ...prev, geometry: geomStr } : prev
                );
                setGeometryStatus("ok");

                // Fly to polygon center
                if (geometry.coordinates?.[0]?.[0]) {
                    const ring = geometry.type === "Polygon"
                        ? geometry.coordinates[0]
                        : geometry.coordinates[0][0];
                    const lats = ring.map((c: number[]) => c[1]);
                    const lngs = ring.map((c: number[]) => c[0]);
                    const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
                    const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                    setFlyTo({ lat, lng, zoom: 17 });
                }
            } catch {
                setGeometryStatus("error");
            } finally {
                setGeometryLoading(false);
            }
        };
        reader.readAsText(file);
    }, [selectedParcel]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] gap-0">
            {/* ── Top toolbar ── */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-white border-b border-gray-100 z-10">
                {/* Title */}
                <div className="flex items-center gap-2 mr-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Harita</span>
                    <span className="text-xs text-gray-400">{filteredParcels.length} parsel</span>
                </div>

                {/* Search */}
                <div ref={searchRef} className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Konum ara..."
                        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {/* Dropdown */}
                    {(searchResults.length > 0 || searchLoading) && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                            {searchLoading && (
                                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Aranıyor...
                                </div>
                            )}
                            {searchResults.map((r) => (
                                <button key={r.place_id} onClick={() => handleSelectResult(r)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-50 last:border-0">
                                    <p className="font-medium text-gray-800 truncate">{r.display_name.split(",")[0]}</p>
                                    <p className="text-gray-400 truncate">{r.display_name.split(",").slice(1, 3).join(",")}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Layer toggle */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    {(Object.keys(TILE_LAYERS) as Array<"street" | "satellite" | "terrain">).map((key) => (
                        <button key={key}
                            onClick={() => setLayerType(key)}
                            className={`px-2.5 py-1.5 font-medium transition-colors ${layerType === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                            {key === "street" ? "Sokak" : key === "satellite" ? "Uydu" : "Arazi"}
                        </button>
                    ))}
                </div>

                {/* Clustering toggle */}
                <button onClick={() => setClustered((v) => !v)}
                    title={clustered ? "Kümelemeyi Kapat" : "Kümelemeyi Aç"}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${clustered ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Küme
                </button>

                {/* Drawing tools */}
                <button onClick={() => setIsDrawing((v) => !v)}
                    title={isDrawing ? "Çizimi Bitir" : "Polygon Çiz"}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDrawing ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                    <Pencil className="h-3.5 w-3.5" />
                    {isDrawing ? "Çiziliyor..." : "Çiz"}
                </button>

                {/* Coord picker */}
                <button onClick={() => { setPickingCoords((v) => !v); setPickedCoords(null); }}
                    title={pickingCoords ? "İptal" : "Haritadan Koordinat Seç"}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${pickingCoords ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                    <Crosshair className="h-3.5 w-3.5" />
                    {pickingCoords ? "Tıkla..." : "Koordinat"}
                </button>

                {/* Filter button (mobile) */}
                <button onClick={() => setIsFilterOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 xl:hidden">
                    <Filter className="h-3.5 w-3.5" />
                    Filtre
                    <ChevronDown className={`h-3 w-3 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* ── Picked coordinates banner ── */}
            {pickedCoords && (
                <div className="flex items-center justify-between px-4 py-2 bg-green-50 border-b border-green-100 text-xs">
                    <span className="text-green-700 font-medium">
                        Seçilen koordinat: <strong>{pickedCoords.lat.toFixed(6)}, {pickedCoords.lng.toFixed(6)}</strong>
                    </span>
                    <button onClick={() => setPickedCoords(null)} className="text-green-600 hover:text-green-800">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* ── Drawn shapes banner ── */}
            {drawnShapes.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-orange-50 border-b border-orange-100 text-xs">
                    <span className="text-orange-700 font-medium">
                        {drawnShapes.length} alan çizildi
                    </span>
                    <button onClick={() => setDrawnShapes([])} className="text-orange-600 hover:text-orange-800 flex items-center gap-1">
                        <X className="h-3.5 w-3.5" /> Temizle
                    </button>
                </div>
            )}

            {/* ── Main content ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Filter sidebar (desktop) */}
                <aside className="hidden xl:flex flex-col w-60 bg-white border-r border-gray-100 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-4 w-4 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 text-sm">Filtreler</h3>
                        </div>

                        {/* Kategori filtresi */}
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Arsa Türü</p>
                        <div className="space-y-1.5 mb-5">
                            {ALL_CATEGORIES.map((cat) => (
                                <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => toggleCategory(cat)}
                                        className="rounded border-gray-300 focus:ring-blue-500"
                                        style={{ accentColor: CATEGORY_COLORS[cat] }}
                                    />
                                    <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm"
                                        style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                                    <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-tight">
                                        {CATEGORY_LABELS[cat]}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* CRM aşaması filtresi */}
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">CRM Aşaması</p>
                        <div className="space-y-1.5">
                            {Object.entries(STAGE_NAMES).map(([key, name]) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox"
                                        checked={selectedStages.includes(key)}
                                        onChange={() => toggleStage(key)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-700 group-hover:text-gray-900">{name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Toplam</span>
                                <span className="font-semibold text-gray-900">{parcels.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Haritada</span>
                                <span className="font-semibold text-blue-600">{filteredParcels.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sınır kayıtlı</span>
                                <span className="font-semibold text-green-600">
                                    {parcels.filter((p) => p.geometry).length}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile filter panel */}
                {isFilterOpen && (
                    <div className="absolute left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-lg p-4 xl:hidden">
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(STAGE_NAMES).map(([key, name]) => (
                                <button key={key} onClick={() => toggleStage(key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedStages.includes(key) ? "border-transparent text-white" : "border-gray-200 text-gray-600 bg-white"}`}
                                    style={selectedStages.includes(key) ? { backgroundColor: STAGE_COLORS[key] } : {}}>
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedStages.includes(key) ? "white" : STAGE_COLORS[key] }} />
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Map */}
                <div className="flex-1 relative">
                    <MapView
                        parcels={filteredParcels}
                        selectedParcel={selectedParcel}
                        layerType={layerType}
                        clustered={clustered}
                        pickingCoords={pickingCoords}
                        isDrawing={isDrawing}
                        flyTo={flyTo}
                        mapCenter={mapCenter}
                        onSelectParcel={setSelectedParcel}
                        onPickCoords={handlePickCoords}
                        onDrawn={handleDrawn}
                    />

                    {/* Hints overlay */}
                    {pickingCoords && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2">
                            <Crosshair className="h-3.5 w-3.5" />
                            Koordinat seçmek için haritaya tıklayın
                        </div>
                    )}
                    {isDrawing && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2">
                            <Pencil className="h-3.5 w-3.5" />
                            Sağ araç çubuğundan şekil seçin
                        </div>
                    )}
                </div>

                {/* Detail panel */}
                {selectedParcel && (
                    <aside className="w-72 bg-white border-l border-gray-100 overflow-y-auto flex flex-col">
                        {/* Panel header */}
                        <div className="flex items-start justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: STAGE_COLORS[selectedParcel.crmStage || "NEW_LEAD"] }} />
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                                        {selectedParcel.city} / {selectedParcel.district}
                                    </p>
                                    <p className="text-xs text-gray-500">{selectedParcel.neighborhood}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedParcel(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Stage badge */}
                        <div className="px-4 pt-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: STAGE_COLORS[selectedParcel.crmStage || "NEW_LEAD"] }}>
                                {STAGE_NAMES[selectedParcel.crmStage || "NEW_LEAD"]}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-3">
                            <DetailRow icon={<Building2 className="h-3.5 w-3.5" />} label="Ada / Parsel"
                                value={`${selectedParcel.island || "-"} / ${selectedParcel.parsel || "-"}`} />
                            {selectedParcel.area && (
                                <DetailRow icon={<Ruler className="h-3.5 w-3.5" />} label="Alan"
                                    value={`${selectedParcel.area.toLocaleString("tr-TR")} m²`} />
                            )}
                            {true && (
                                <div className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-2 flex-shrink-0"><Tag className="h-3.5 w-3.5" /></span>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 mb-1">Kategori</p>
                                        <select
                                            value={selectedParcel.category || "UNCATEGORIZED"}
                                            onChange={(e) => handleCategoryChange(selectedParcel, e.target.value)}
                                            className="w-full text-sm font-medium border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                                            style={{ color: CATEGORY_COLORS[selectedParcel.category] || CATEGORY_COLORS.UNCATEGORIZED }}
                                        >
                                            {ALL_CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat} style={{ color: CATEGORY_COLORS[cat] }}>
                                                    {CATEGORY_LABELS[cat]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            {selectedParcel.askingPrice && (
                                <DetailRow icon={<TrendingUp className="h-3.5 w-3.5" />} label="İstenen Fiyat"
                                    value={`₺${selectedParcel.askingPrice.toLocaleString("tr-TR")}`} />
                            )}
                            {selectedParcel.latitude && (
                                <DetailRow icon={<Crosshair className="h-3.5 w-3.5" />} label="Koordinat"
                                    value={`${selectedParcel.latitude.toFixed(5)}, ${selectedParcel.longitude.toFixed(5)}`} />
                            )}
                            {selectedParcel.tags && selectedParcel.tags.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1.5">Etiketler</p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedParcel.tags.map((tag: string) => (
                                            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Geometry section */}
                        <div className="px-4 pb-2 border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-400 mb-2 font-medium">Arsa Sınırı</p>

                            {selectedParcel.geometry ? (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                                        Polygon kayıtlı
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <FolderOpen className="h-3 w-3" /> JSON ile Değiştir
                                    </button>
                                    <button onClick={() => handleDeleteGeometry(selectedParcel)}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 className="h-3 w-3" /> Sınırı Sil
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {selectedParcel.latitude ? (
                                        <button onClick={() => handleFetchGeometry(selectedParcel)}
                                            disabled={geometryLoading}
                                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50">
                                            {geometryLoading
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Download className="h-3.5 w-3.5" />}
                                            TKGM'den Yükle
                                        </button>
                                    ) : null}

                                    {lastDrawnGeometry && (
                                        <button onClick={handleSaveDrawnGeometry}
                                            disabled={geometryLoading}
                                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50">
                                            {geometryLoading
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Pencil className="h-3.5 w-3.5" />}
                                            Çizilen Sınırı Kaydet
                                        </button>
                                    )}

                                    {geometryStatus === "error" && (
                                        <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">
                                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                            TKGM'den alınamadı. Manuel çizin.
                                        </div>
                                    )}

                                    {/* JSON file import */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={geometryLoading}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        TKGM JSON Yükle
                                    </button>

                                    {!selectedParcel.latitude && (
                                        <p className="text-xs text-gray-400 text-center">Koordinat eklenince TKGM'den çekilebilir</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Fly to */}
                        <div className="px-4 pb-2">
                            <button
                                onClick={() => setFlyTo({ lat: selectedParcel.latitude, lng: selectedParcel.longitude, zoom: 16 })}
                                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                                <MapPin className="h-3.5 w-3.5" />
                                Haritada Odaklan
                            </button>
                        </div>

                        {/* Go to detail */}
                        <div className="px-4 pb-4">
                            <a href={`/parcels/${selectedParcel.id}`}
                                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Parsel Detayına Git
                            </a>
                        </div>

                        {/* Hidden file input for TKGM JSON import */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={handleImportJson}
                        />
                    </aside>
                )}
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );
}

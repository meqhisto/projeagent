"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, Filter, Loader2, X, ChevronDown } from "lucide-react";

// Import Leaflet components dynamically to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

const STAGE_COLORS: Record<string, string> = {
    NEW_LEAD: "#3B82F6",
    CONTACTED: "#A855F7",
    ANALYSIS: "#EAB308",
    OFFER_SENT: "#6366F1",
    CONTRACT: "#22C55E",
    LOST: "#6B7280",
};

const STAGE_NAMES: Record<string, string> = {
    NEW_LEAD: "Yeni Fırsat",
    CONTACTED: "İletişimde",
    ANALYSIS: "Analiz",
    OFFER_SENT: "Teklif Gönderildi",
    CONTRACT: "Sözleşme",
    LOST: "Kayıp",
};

export default function MapPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStages, setSelectedStages] = useState<string[]>([
        "NEW_LEAD",
        "CONTACTED",
        "ANALYSIS",
        "OFFER_SENT",
        "CONTRACT",
    ]);
    const [icon, setIcon] = useState<any>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchParcels();

        // Setup Leaflet icon after component mounts
        import("leaflet").then((L) => {
            const defaultIcon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });
            setIcon(defaultIcon);
        });
    }, []);

    const fetchParcels = async () => {
        try {
            const res = await fetch("/api/parcels");
            if (res.ok) {
                const data = await res.json();
                setParcels(data);
            }
        } catch (error) {
            console.error("Failed to fetch parcels", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStage = (stage: string) => {
        setSelectedStages((prev) =>
            prev.includes(stage)
                ? prev.filter((s) => s !== stage)
                : [...prev, stage]
        );
    };

    const filteredParcels = useMemo(() => {
        return parcels.filter(
            (p) =>
                p.latitude &&
                p.longitude &&
                selectedStages.includes(p.crmStage || "NEW_LEAD")
        );
    }, [parcels, selectedStages]);

    // Calculate center from parcels
    const mapCenter: [number, number] = useMemo(() => {
        if (filteredParcels.length === 0) return [39.9334, 32.8597]; // Ankara center
        const avgLat =
            filteredParcels.reduce((sum, p) => sum + p.latitude, 0) /
            filteredParcels.length;
        const avgLon =
            filteredParcels.reduce((sum, p) => sum + p.longitude, 0) /
            filteredParcels.length;
        return [avgLat, avgLon];
    }, [filteredParcels]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 lg:gap-3">
                    <MapPin className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                    <div>
                        <h1 className="text-lg lg:text-xl font-bold text-gray-900">Harita Görünümü</h1>
                        <p className="text-xs text-gray-500">
                            {filteredParcels.length} parsel görüntüleniyor
                        </p>
                    </div>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 text-sm font-medium"
                >
                    <Filter className="h-4 w-4" />
                    Filtre
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Legend */}
                <div className="hidden lg:flex items-center gap-2 text-xs flex-wrap">
                    {Object.entries(STAGE_NAMES).map(([key, name]) => (
                        <div key={key} className="flex items-center gap-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: STAGE_COLORS[key] }}
                            ></div>
                            <span className="text-gray-600">{name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Filter Panel */}
            {isFilterOpen && (
                <div className="lg:hidden bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(STAGE_NAMES).map(([key, name]) => (
                            <button
                                key={key}
                                onClick={() => toggleStage(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedStages.includes(key)
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: selectedStages.includes(key) ? '#fff' : STAGE_COLORS[key] }}
                                ></div>
                                {name}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        {filteredParcels.length} / {parcels.length} parsel görünür
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="flex gap-4 h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)]">
                {/* Desktop Filter Sidebar */}
                <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5 text-purple-600" />
                        <h3 className="font-bold text-gray-900">Filtreler</h3>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase">CRM Aşaması</p>
                        {Object.entries(STAGE_NAMES).map(([key, name]) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedStages.includes(key)}
                                    onChange={() => toggleStage(key)}
                                    className="rounded text-purple-600 focus:ring-purple-500"
                                />
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: STAGE_COLORS[key] }}
                                ></div>
                                <span className="text-sm text-gray-700">{name}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                            <span className="font-bold">{parcels.length}</span> toplam parsel
                        </p>
                        <p className="text-xs text-gray-600">
                            <span className="font-bold">{filteredParcels.length}</span> haritada
                        </p>
                    </div>
                </aside>

                {/* Map */}
                <div className="flex-1 relative">
                    {icon && (
                        <MapContainer
                            center={mapCenter}
                            zoom={6}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {filteredParcels.map((parcel) => (
                                <Marker
                                    key={parcel.id}
                                    position={[parcel.latitude, parcel.longitude]}
                                    icon={icon}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <h3 className="font-bold text-gray-900 mb-1">
                                                {parcel.city} / {parcel.district}
                                            </h3>
                                            <p className="text-xs text-gray-600 mb-2">
                                                {parcel.neighborhood}
                                            </p>
                                            <p className="text-xs text-gray-500 mb-2">
                                                Ada: {parcel.island} | Parsel: {parcel.parsel}
                                            </p>
                                            {parcel.area && (
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Alan: {parcel.area} m²
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-xs px-2 py-1 rounded font-bold text-white"
                                                    style={{
                                                        backgroundColor:
                                                            STAGE_COLORS[parcel.crmStage || "NEW_LEAD"],
                                                    }}
                                                >
                                                    {STAGE_NAMES[parcel.crmStage || "NEW_LEAD"]}
                                                </span>
                                                <a
                                                    href={`/parcels/${parcel.id}`}
                                                    className="text-xs text-purple-600 font-bold hover:underline"
                                                >
                                                    Detaya Git →
                                                </a>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                    {!icon && (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

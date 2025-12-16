"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, Filter, Loader2 } from "lucide-react";

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
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 z-30 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-purple-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Harita Görünümü</h1>
                            <p className="text-xs text-gray-500">
                                {filteredParcels.length} parsel görüntüleniyor
                            </p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-2 text-xs">
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
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Filter Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
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

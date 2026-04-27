"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet-draw";

export const STAGE_COLORS: Record<string, string> = {
    NEW_LEAD: "#3B82F6",
    CONTACTED: "#A855F7",
    ANALYSIS: "#EAB308",
    OFFER_SENT: "#6366F1",
    CONTRACT: "#22C55E",
    LOST: "#6B7280",
};

export const CATEGORY_COLORS: Record<string, string> = {
    RESIDENTIAL:    "#22C55E", // yeşil — konut
    COMMERCIAL:     "#F97316", // turuncu — ticari
    MIXED_USE:      "#8B5CF6", // mor — karma (ticari + konut)
    INDUSTRIAL:     "#64748B", // çelik mavi — sanayi
    AGRICULTURAL:   "#84CC16", // açık yeşil — tarım
    TOURISM:        "#06B6D4", // turkuaz — turizm
    INVESTMENT:     "#EAB308", // sarı — yatırım
    DEVELOPMENT:    "#EC4899", // pembe — geliştirme
    UNCATEGORIZED:  "#94A3B8", // gri — kategorisiz
};

export const CATEGORY_LABELS: Record<string, string> = {
    RESIDENTIAL:   "Konut",
    COMMERCIAL:    "Ticari",
    MIXED_USE:     "Karma (Ticari + Konut)",
    INDUSTRIAL:    "Sanayi",
    AGRICULTURAL:  "Tarım",
    TOURISM:       "Turizm",
    INVESTMENT:    "Yatırım",
    DEVELOPMENT:   "Geliştirme",
    UNCATEGORIZED: "Kategorisiz",
};

export function parcelColor(parcel: any): string {
    return CATEGORY_COLORS[parcel.category] ?? CATEGORY_COLORS.UNCATEGORIZED;
}

export const TILE_LAYERS: Record<string, { url: string; attribution: string }> = {
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri",
    },
    terrain: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
};

function createMarkerIcon(color: string, selected = false) {
    const s = selected ? 42 : 32;
    const html = `
    <div style="position:relative;width:${s}px;height:${s * 1.3}px">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="${s}" height="${s * 1.3}">
        <path d="M16 1C9.4 1 4 6.4 4 13c0 9.5 12 28 12 28S28 22.5 28 13C28 6.4 22.6 1 16 1z"
          fill="${color}" stroke="white" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <circle cx="16" cy="13" r="5.5" fill="white" opacity="0.95"/>
      </svg>
      ${selected ? `<div style="position:absolute;inset:-6px;border:3px solid ${color};border-radius:50%;opacity:0.4;"></div>` : ""}
    </div>`;
    return L.divIcon({
        html,
        className: "",
        iconSize: [s, s * 1.3],
        iconAnchor: [s / 2, s * 1.3],
        popupAnchor: [0, -s * 1.3 + 4],
    });
}

// Fly to a location on state change
function FlyController({ target }: { target: { lat: number; lng: number; zoom: number } | null }) {
    const map = useMap();
    const prev = useRef<typeof target>(null);
    useEffect(() => {
        if (target && target !== prev.current) {
            prev.current = target;
            map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.2 });
        }
    }, [target, map]);
    return null;
}

// Crosshair click-to-pick-coordinates
function CoordPicker({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (active) onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Clustered markers with colored icons
function ClusteredMarkers({
    parcels,
    selectedId,
    clustered,
    onSelect,
}: {
    parcels: any[];
    selectedId: string | null;
    clustered: boolean;
    onSelect: (p: any) => void;
}) {
    const map = useMap();
    const groupRef = useRef<any>(null);

    useEffect(() => {
        if (groupRef.current) {
            map.removeLayer(groupRef.current);
            groupRef.current = null;
        }

        const LMC = L as any;

        const group = clustered
            ? LMC.markerClusterGroup({
                  chunkedLoading: true,
                  maxClusterRadius: 55,
                  spiderfyOnMaxZoom: true,
                  showCoverageOnHover: false,
                  iconCreateFunction: (cluster: any) => {
                      const count = cluster.getChildCount();
                      return L.divIcon({
                          html: `<div style="background:#0071e3;color:white;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid white;box-shadow:0 3px 10px rgba(0,113,227,0.4)">${count}</div>`,
                          className: "",
                          iconSize: [42, 42],
                          iconAnchor: [21, 21],
                      });
                  },
              })
            : L.featureGroup();

        parcels.forEach((parcel) => {
            const color = parcelColor(parcel);
            const icon = createMarkerIcon(color, parcel.id === selectedId);
            const marker = L.marker([parcel.latitude, parcel.longitude], { icon });

            // Hover tooltip
            const z = parcel.zoning;
            const tooltipHtml = `
                <div style="min-width:180px;font-family:system-ui,sans-serif">
                    <div style="font-weight:700;font-size:13px;color:#111;margin-bottom:2px">
                        ${parcel.city} / ${parcel.district}
                    </div>
                    <div style="font-size:11px;color:#6b7280;margin-bottom:6px">${parcel.neighborhood || ""}</div>
                    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">
                        <span style="background:${color};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">
                            ${CATEGORY_LABELS[parcel.category] ?? "Kategorisiz"}
                        </span>
                        ${parcel.area ? `<span style="background:#f1f5f9;color:#374151;border-radius:4px;padding:2px 7px;font-size:11px">${Number(parcel.area).toLocaleString("tr-TR")} m²</span>` : ""}
                    </div>
                    ${z ? `<div style="border-top:1px solid #f3f4f6;padding-top:5px;display:grid;grid-template-columns:1fr 1fr;gap:3px 10px">
                        ${z.ks != null ? `<div><span style="font-size:10px;color:#9ca3af">KAKS/Emsal</span><br><span style="font-size:12px;font-weight:600;color:#111">${z.ks}</span></div>` : ""}
                        ${z.taks != null ? `<div><span style="font-size:10px;color:#9ca3af">TAKS</span><br><span style="font-size:12px;font-weight:600;color:#111">${z.taks}</span></div>` : ""}
                        ${z.maxHeight != null ? `<div><span style="font-size:10px;color:#9ca3af">Max Yükseklik</span><br><span style="font-size:12px;font-weight:600;color:#111">${z.maxHeight} m</span></div>` : ""}
                        ${z.zoningType ? `<div><span style="font-size:10px;color:#9ca3af">İmar Türü</span><br><span style="font-size:12px;font-weight:600;color:#111">${z.zoningType}</span></div>` : ""}
                    </div>` : ""}
                    ${parcel.island ? `<div style="font-size:10px;color:#d1d5db;margin-top:5px;border-top:1px solid #f9fafb;padding-top:4px">Ada ${parcel.island} / Parsel ${parcel.parsel}</div>` : ""}
                </div>`;

            marker.bindTooltip(tooltipHtml, {
                direction: "top",
                offset: [0, -30],
                opacity: 1,
                className: "parcel-tooltip",
            });

            marker.on("click", () => onSelect(parcel));
            group.addLayer(marker);
        });

        map.addLayer(group);
        groupRef.current = group;

        return () => {
            if (groupRef.current) {
                map.removeLayer(groupRef.current);
                groupRef.current = null;
            }
        };
    }, [map, parcels, selectedId, clustered, onSelect]);

    return null;
}

// Leaflet Draw integration
function DrawTools({ active, onDrawn }: { active: boolean; onDrawn: (geoJson: any) => void }) {
    const map = useMap();
    const controlRef = useRef<any>(null);
    const layersRef = useRef<any>(null);

    useEffect(() => {
        const LDraw = L as any;

        if (!active) {
            if (controlRef.current) {
                map.removeControl(controlRef.current);
                controlRef.current = null;
            }
            return;
        }

        if (!layersRef.current) {
            layersRef.current = new L.FeatureGroup();
            map.addLayer(layersRef.current);
        }

        const ctrl = new LDraw.Control.Draw({
            position: "topright",
            draw: {
                polygon: { shapeOptions: { color: "#0071e3", fillOpacity: 0.15 } },
                rectangle: { shapeOptions: { color: "#0071e3", fillOpacity: 0.15 } },
                polyline: false,
                circle: false,
                circlemarker: false,
                marker: false,
            },
            edit: { featureGroup: layersRef.current, remove: true },
        });

        map.addControl(ctrl);
        controlRef.current = ctrl;

        const handleCreated = (e: any) => {
            layersRef.current.addLayer(e.layer);
            onDrawn(e.layer.toGeoJSON());
        };

        map.on(LDraw.Draw.Event.CREATED, handleCreated);
        return () => {
            map.off(LDraw.Draw.Event.CREATED, handleCreated);
            if (controlRef.current) {
                map.removeControl(controlRef.current);
                controlRef.current = null;
            }
        };
    }, [map, active, onDrawn]);

    return null;
}

// GeoJSON geometry → Leaflet LatLng rings
function geoJsonToLatLngs(geometry: any): L.LatLngTuple[][] {
    if (!geometry) return [];
    if (geometry.type === "Polygon") {
        return geometry.coordinates.map((ring: number[][]) =>
            ring.map(([lng, lat]): L.LatLngTuple => [lat, lng])
        );
    }
    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.flatMap((poly: number[][][]) =>
            poly.map((ring: number[][]) =>
                ring.map(([lng, lat]): L.LatLngTuple => [lat, lng])
            )
        );
    }
    return [];
}

// Parcel polygon overlays
function ParcelPolygons({
    parcels,
    selectedId,
    onSelect,
}: {
    parcels: any[];
    selectedId: string | null;
    onSelect: (p: any) => void;
}) {
    return (
        <>
            {parcels.map((parcel) => {
                if (!parcel.geometry) return null;
                let geometry: any;
                try {
                    geometry = typeof parcel.geometry === "string"
                        ? JSON.parse(parcel.geometry)
                        : parcel.geometry;
                } catch { return null; }

                const rings = geoJsonToLatLngs(geometry);
                if (!rings.length) return null;

                const isSelected = String(parcel.id) === String(selectedId);
                const color = parcelColor(parcel);

                return (
                    <Polygon
                        key={`poly-${parcel.id}`}
                        positions={rings as any}
                        pathOptions={{
                            color,
                            fillColor: color,
                            fillOpacity: isSelected ? 0.4 : 0.18,
                            weight: isSelected ? 3 : 2,
                            opacity: isSelected ? 1 : 0.8,
                        }}
                        eventHandlers={{ click: () => onSelect(parcel) }}
                    >
                        <Tooltip sticky opacity={1} className="parcel-tooltip">
                            <div style={{ minWidth: 180, fontFamily: "system-ui,sans-serif" }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 2 }}>
                                    {parcel.city} / {parcel.district}
                                </div>
                                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{parcel.neighborhood}</div>
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, marginBottom: 6 }}>
                                    <span style={{ background: color, color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                                        {CATEGORY_LABELS[parcel.category] ?? "Kategorisiz"}
                                    </span>
                                    {parcel.area && (
                                        <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: 4, padding: "2px 7px", fontSize: 11 }}>
                                            {Number(parcel.area).toLocaleString("tr-TR")} m²
                                        </span>
                                    )}
                                </div>
                                {parcel.zoning && (
                                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 10px" }}>
                                        {parcel.zoning.ks != null && <div><span style={{ fontSize: 10, color: "#9ca3af" }}>KAKS/Emsal</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{parcel.zoning.ks}</span></div>}
                                        {parcel.zoning.taks != null && <div><span style={{ fontSize: 10, color: "#9ca3af" }}>TAKS</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{parcel.zoning.taks}</span></div>}
                                        {parcel.zoning.maxHeight != null && <div><span style={{ fontSize: 10, color: "#9ca3af" }}>Max Yükseklik</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{parcel.zoning.maxHeight} m</span></div>}
                                        {parcel.zoning.zoningType && <div><span style={{ fontSize: 10, color: "#9ca3af" }}>İmar Türü</span><br /><span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{parcel.zoning.zoningType}</span></div>}
                                    </div>
                                )}
                                {parcel.island && (
                                    <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 5, borderTop: "1px solid #f9fafb", paddingTop: 4 }}>
                                        Ada {parcel.island} / Parsel {parcel.parsel}
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                    </Polygon>
                );
            })}
        </>
    );
}

export interface MapViewProps {
    parcels: any[];
    selectedParcel: any | null;
    layerType: "street" | "satellite" | "terrain";
    clustered: boolean;
    pickingCoords: boolean;
    isDrawing: boolean;
    flyTo: { lat: number; lng: number; zoom: number } | null;
    mapCenter: [number, number];
    onSelectParcel: (p: any) => void;
    onPickCoords: (lat: number, lng: number) => void;
    onDrawn: (geoJson: any) => void;
}

export default function MapView({
    parcels,
    selectedParcel,
    layerType,
    clustered,
    pickingCoords,
    isDrawing,
    flyTo,
    mapCenter,
    onSelectParcel,
    onPickCoords,
    onDrawn,
}: MapViewProps) {
    const tile = TILE_LAYERS[layerType];

    return (
        <MapContainer
            center={mapCenter}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
            className={pickingCoords ? "map-picking-coords" : ""}
        >
            <TileLayer url={tile.url} attribution={tile.attribution} />

            {/* Parcel boundary polygons */}
            <ParcelPolygons
                parcels={parcels}
                selectedId={selectedParcel?.id ?? null}
                onSelect={onSelectParcel}
            />

            {/* Point markers (clustered) — all parcels with coordinates */}
            <ClusteredMarkers
                parcels={parcels.filter((p) => p.latitude && p.longitude)}
                selectedId={selectedParcel?.id ?? null}
                clustered={clustered}
                onSelect={onSelectParcel}
            />

            <CoordPicker active={pickingCoords} onPick={onPickCoords} />
            <FlyController target={flyTo} />
            <DrawTools active={isDrawing} onDrawn={onDrawn} />
        </MapContainer>
    );
}

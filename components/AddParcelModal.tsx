"use client";

import { useState, useRef } from "react";
import { X, Upload, Check, AlertCircle, Loader2, FileJson, FormInput } from "lucide-react";
import { createNotification } from "@/lib/notifications";

interface AddParcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type InputMode = "manual" | "json";

interface ManualFormData {
    city: string;
    district: string;
    neighborhood: string;
    island: string;
    parsel: string;
    area: string;
    latitude: string;
    longitude: string;
}

export default function AddParcelModal({ isOpen, onClose, onSuccess }: AddParcelModalProps) {
    const [mode, setMode] = useState<InputMode>("manual");
    const [jsonInput, setJsonInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Manual form state
    const [formData, setFormData] = useState<ManualFormData>({
        city: "",
        district: "",
        neighborhood: "",
        island: "",
        parsel: "",
        area: "",
        latitude: "",
        longitude: "",
    });

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
            setError("Lütfen geçerli bir .json dosyası yükleyin.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setJsonInput(e.target.result as string);
                setError(null);
            }
        };
        reader.readAsText(file);
    };

    const handleFormChange = (field: keyof ManualFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateManualForm = (): boolean => {
        const missingFields: string[] = [];
        if (!formData.city.trim()) missingFields.push("İl");
        if (!formData.district.trim()) missingFields.push("İlçe");
        if (!formData.island.trim()) missingFields.push("Ada");
        if (!formData.parsel.trim()) missingFields.push("Parsel");

        if (missingFields.length > 0) {
            setError(`Lütfen şu alanları doldurun: ${missingFields.join(", ")}`);
            return false;
        }
        return true;
    };

    const handleManualSubmit = async () => {
        if (!validateManualForm()) return;

        setLoading(true);
        setError(null);

        try {
            const payload = {
                city: formData.city.trim(),
                district: formData.district.trim(),
                neighborhood: formData.neighborhood.trim() || "-",
                island: formData.island.trim(),
                parsel: formData.parsel.trim(),
                area: formData.area ? parseFloat(formData.area) : null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            };

            const res = await fetch("/api/parcels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const resData = await res.json();
                throw new Error(resData.error || `Sunucu hatası (${res.status})`);
            }

            await createNotification({
                type: "PARCEL_ADDED",
                title: "Yeni Parsel Eklendi",
                message: `${formData.city} - ${formData.district} parseli başarıyla eklendi ve araştırma başlatıldı.`,
            });

            // Reset form
            setFormData({
                city: "",
                district: "",
                neighborhood: "",
                island: "",
                parsel: "",
                area: "",
                latitude: "",
                longitude: "",
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const parseNumber = (val: string | number | undefined | null) => {
        if (!val) return null;
        if (typeof val === 'number') return val;
        const normalized = val.replace(/\./g, "").replace(",", ".");
        return parseFloat(normalized);
    };

    const findProp = (obj: any, keys: string[]) => {
        if (!obj) return undefined;
        for (const key of keys) {
            if (obj[key] !== undefined) return obj[key];
            const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
            if (found) return obj[found];
        }
        return undefined;
    };

    const handleJsonSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            let data;
            try {
                data = JSON.parse(jsonInput);
            } catch (e) {
                throw new Error("Geçersiz JSON formatı. Lütfen kontrol edin.");
            }

            let itemsToProcess = [];

            // GeoJSON FeatureCollection support
            if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
                itemsToProcess = data.features.map((f: any) => {
                    const p = f.properties || {};
                    let lat = null, lon = null;
                    if (f.geometry && f.geometry.coordinates) {
                        if (f.geometry.type === "Point") {
                            lon = f.geometry.coordinates[0];
                            lat = f.geometry.coordinates[1];
                        } else if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
                            const coords = f.geometry.type === "Polygon"
                                ? f.geometry.coordinates[0][0]
                                : f.geometry.coordinates[0][0][0];
                            lon = coords[0];
                            lat = coords[1];
                        }
                    }

                    const extractedParcel = findProp(p, ["Parsel", "ParselNo", "parcel", "parsel", "ParselNo."]);

                    return {
                        city: findProp(p, ["Il", "city", "Vilayet", "il"]),
                        district: findProp(p, ["Ilce", "district", "Town", "ilce"]),
                        neighborhood: String(findProp(p, ["Mahalle", "neighborhood", "mahalle", "Mah"]) || "-"),
                        island: String(findProp(p, ["Ada", "island", "Block", "ada", "AdaNo"]) || ""),
                        parsel: String(extractedParcel || (Object.keys(p).find(k => k.toLowerCase().includes("parsel")) ? p[Object.keys(p).find(k => k.toLowerCase().includes("parsel"))!] : "") || ""),
                        area: parseNumber(findProp(p, ["Alan", "area", "alan"])),
                        latitude: lat,
                        longitude: lon
                    };
                });
            } else {
                const list = Array.isArray(data) ? data : [data];
                itemsToProcess = list.map((item: any) => ({
                    city: findProp(item, ["il", "city", "Il", "Vilayet"]),
                    district: findProp(item, ["ilce", "district", "Ilce", "Town"]),
                    neighborhood: String(findProp(item, ["mahalle", "neighborhood", "Mahalle", "Mah"]) || "-"),
                    island: String(findProp(item, ["ada", "island", "Ada", "Block", "AdaNo"]) || ""),
                    parsel: String(findProp(item, ["parsel", "parcel", "ParselNo", "Parsel", "ParselNo."]) || ""),
                    area: parseNumber(findProp(item, ["alan", "area", "Alan"])),
                    latitude: item.latitude || item.lat || null,
                    longitude: item.longitude || item.lon || item.lng || null
                }));
            }

            let successCount = 0;
            let lastError = "";

            for (const payload of itemsToProcess) {
                if (!payload.city || !payload.district || !payload.island || !payload.parsel) {
                    lastError = "Bazı kayıtlarda İl, İlçe, Ada veya Parsel bilgisi eksik.";
                    continue;
                }

                const res = await fetch("/api/parcels", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    successCount++;
                } else {
                    const resData = await res.json();
                    lastError = resData.error || `Sunucu hatası (${res.status})`;
                }
            }

            if (successCount === 0) {
                throw new Error(lastError || "Hiçbir parsel eklenemedi. Veri formatını kontrol edin.");
            }

            await createNotification({
                type: "PARCEL_ADDED",
                title: `${successCount} Yeni Parsel Eklendi`,
                message: `${successCount} adet parsel başarıyla sisteme eklendi ve araştırma başlatıldı.`,
            });

            setJsonInput("");
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b p-4">
                    <h3 className="text-lg font-semibold text-gray-900">Parsel Ekle</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b bg-gray-50">
                    <button
                        onClick={() => setMode("manual")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${mode === "manual"
                                ? "border-b-2 border-emerald-600 text-emerald-600 bg-white"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                    >
                        <FormInput className="h-4 w-4" />
                        Manuel Giriş
                    </button>
                    <button
                        onClick={() => setMode("json")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${mode === "json"
                                ? "border-b-2 border-emerald-600 text-emerald-600 bg-white"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                    >
                        <FileJson className="h-4 w-4" />
                        JSON Yükleme
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {mode === "manual" ? (
                        /* Manual Form */
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* İl */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        İl <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleFormChange("city", e.target.value)}
                                        placeholder="Örn: İstanbul"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>

                                {/* İlçe */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        İlçe <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={(e) => handleFormChange("district", e.target.value)}
                                        placeholder="Örn: Kadıköy"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Mahalle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mahalle
                                </label>
                                <input
                                    type="text"
                                    value={formData.neighborhood}
                                    onChange={(e) => handleFormChange("neighborhood", e.target.value)}
                                    placeholder="Örn: Moda (Opsiyonel)"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Ada */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ada <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.island}
                                        onChange={(e) => handleFormChange("island", e.target.value)}
                                        placeholder="Örn: 123"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>

                                {/* Parsel */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Parsel <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.parsel}
                                        onChange={(e) => handleFormChange("parsel", e.target.value)}
                                        placeholder="Örn: 45"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Alan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alan (m²)
                                </label>
                                <input
                                    type="number"
                                    value={formData.area}
                                    onChange={(e) => handleFormChange("area", e.target.value)}
                                    placeholder="Örn: 500.50 (Opsiyonel)"
                                    step="0.01"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Enlem */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Enlem (Latitude)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.latitude}
                                        onChange={(e) => handleFormChange("latitude", e.target.value)}
                                        placeholder="40.9923"
                                        step="any"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>

                                {/* Boylam */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Boylam (Longitude)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.longitude}
                                        onChange={(e) => handleFormChange("longitude", e.target.value)}
                                        placeholder="29.0254"
                                        step="any"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-800">
                                    <span className="text-red-500 font-semibold">*</span> işaretli alanlar zorunludur.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* JSON Upload Mode */
                        <>
                            <div
                                className={`cursor-pointer mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${dragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50 bg-slate-50"
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".json,application/json"
                                    onChange={handleFileChange}
                                />
                                <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-gray-200 mb-3">
                                    <Upload className={`h-6 w-6 ${dragActive ? 'text-emerald-500' : 'text-gray-400'}`} />
                                </div>
                                <p className="text-sm font-medium text-gray-900 text-center">Dosyayı sürükleyip bırakın</p>
                                <p className="text-xs text-gray-500 mt-1 text-center">veya seçmek için tıklayın (.json)</p>
                            </div>

                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">JSON Verisi</label>
                                <button
                                    onClick={() => setJsonInput("")}
                                    className="text-xs text-gray-400 hover:text-red-500"
                                    hidden={!jsonInput}
                                >
                                    Temizle
                                </button>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="h-40 w-full rounded-lg border border-gray-300 p-3 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-slate-600"
                                placeholder={`GeoJSON FeatureCollection veya JSON Array...\n\nÖrnek:\n{"features":[{"properties":{"ParselNo":"2","Ada":"1115",...}}]}`}
                            />
                        </>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t bg-gray-50 p-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        İptal
                    </button>
                    <button
                        onClick={mode === "manual" ? handleManualSubmit : handleJsonSubmit}
                        disabled={loading || (mode === "manual" ? false : !jsonInput)}
                        className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        {mode === "manual" ? "Parseli Kaydet" : "Parselleri Kaydet"}
                    </button>
                </div>
            </div>
        </div>
    );
}

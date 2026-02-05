"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Check, AlertCircle, Loader2, FileJson, FormInput, Tag, Folder } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { useToast } from "@/components/ui/Toast";
import { PARCEL_CATEGORIES } from "@/lib/validations";
import clsx from "clsx";

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
    category: string;
    tags: string;
}

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
    RESIDENTIAL: "Konut Arsası",
    COMMERCIAL: "Ticari Arsa",
    INDUSTRIAL: "Sanayi Arsası",
    AGRICULTURAL: "Tarım Arazisi",
    MIXED_USE: "Karma Kullanım",
    TOURISM: "Turizm Arsası",
    INVESTMENT: "Yatırım Amaçlı",
    DEVELOPMENT: "Geliştirme Arazisi",
    UNCATEGORIZED: "Kategorisiz",
};

export default function AddParcelDrawer({ isOpen, onClose, onSuccess }: AddParcelModalProps) {
    const toast = useToast();
    const [mode, setMode] = useState<InputMode>("manual");
    const [jsonInput, setJsonInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Animation control
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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
        category: "UNCATEGORIZED",
        tags: "",
    });

    if (!isOpen && !isVisible) return null;

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
                category: formData.category || "UNCATEGORIZED",
                tags: formData.tags.trim() || null,
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

            toast.success("Parsel Eklendi", `${formData.city} - ${formData.district} parseli başarıyla eklendi.`);

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
                category: "UNCATEGORIZED",
                tags: "",
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
            toast.error("Hata", err.message);
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

            toast.success("İçe Aktarma Başarılı", `${successCount} parsel başarıyla eklendi.`);

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
        <div
            className={clsx(
                "fixed inset-0 z-[100] flex justify-end transition-all duration-300",
                isOpen ? "bg-black/20 backdrop-blur-sm pointer-events-auto" : "bg-transparent pointer-events-none"
            )}
            onClick={onClose}
        >
            {/* Drawer */}
            <div
                className={clsx(
                    "h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Parsel Ekle</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Sisteme yeni bir gayrimenkul ekleyin.</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-100 p-1 bg-white">
                    <button
                        onClick={() => setMode("manual")}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            mode === "manual" ? "bg-[#0071e3]/10 text-[#0077ed] shadow-sm" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <FormInput className="h-4 w-4" />
                        Manuel
                    </button>
                    <button
                        onClick={() => setMode("json")}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            mode === "json" ? "bg-[#0071e3]/10 text-[#0077ed] shadow-sm" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <FileJson className="h-4 w-4" />
                        JSON Yükle
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {mode === "manual" ? (
                        /* Manual Form */
                        <div className="space-y-5">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Lokasyon Bilgileri</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">İl</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => handleFormChange("city", e.target.value)}
                                            placeholder="İstanbul"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">İlçe</label>
                                        <input
                                            type="text"
                                            value={formData.district}
                                            onChange={(e) => handleFormChange("district", e.target.value)}
                                            placeholder="Kadıköy"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mahalle</label>
                                    <input
                                        type="text"
                                        value={formData.neighborhood}
                                        onChange={(e) => handleFormChange("neighborhood", e.target.value)}
                                        placeholder="Moda (Opsiyonel)"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tapu Bilgileri</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Ada</label>
                                        <input
                                            type="text"
                                            value={formData.island}
                                            onChange={(e) => handleFormChange("island", e.target.value)}
                                            placeholder="123"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Parsel</label>
                                        <input
                                            type="text"
                                            value={formData.parsel}
                                            onChange={(e) => handleFormChange("parsel", e.target.value)}
                                            placeholder="45"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Alan (m²)</label>
                                    <input
                                        type="number"
                                        value={formData.area}
                                        onChange={(e) => handleFormChange("area", e.target.value)}
                                        placeholder="500.50"
                                        step="0.01"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Koordinatlar (Opsiyonel)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Enlem (Lat)</label>
                                        <input
                                            type="number"
                                            value={formData.latitude}
                                            onChange={(e) => handleFormChange("latitude", e.target.value)}
                                            placeholder="40.9923"
                                            step="any"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Boylam (Lon)</label>
                                        <input
                                            type="number"
                                            value={formData.longitude}
                                            onChange={(e) => handleFormChange("longitude", e.target.value)}
                                            placeholder="29.0254"
                                            step="any"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Kategori ve Etiketler</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleFormChange("category", e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                    >
                                        {PARCEL_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {CATEGORY_LABELS[cat] || cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Etiketler (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => handleFormChange("tags", e.target.value)}
                                        placeholder="deniz manzarası, köşe parsel, yola cepheli"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Virgülle ayırarak birden fazla etiket ekleyebilirsiniz</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* JSON Upload Mode */
                        <div className="space-y-4 h-full flex flex-col">
                            <div
                                className={`flex-1 cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${dragActive ? "border-[#0071e3] bg-[#0071e3]/10" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50 bg-slate-50/50"
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
                                <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-100 mb-4">
                                    <Upload className={`h-8 w-8 ${dragActive ? 'text-[#0071e3]' : 'text-slate-400'}`} />
                                </div>
                                <p className="text-sm font-medium text-slate-900 text-center">Dosyayı sürükleyip bırakın</p>
                                <p className="text-xs text-slate-500 mt-1 text-center">veya seçmek için tıklayın (.json)</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">JSON Verisi</label>
                                    <button
                                        onClick={() => setJsonInput("")}
                                        className="text-xs text-slate-400 hover:text-red-500"
                                        hidden={!jsonInput}
                                    >
                                        Temizle
                                    </button>
                                </div>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="h-40 w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] font-mono text-slate-600 bg-slate-50/50 resize-none"
                                    placeholder={`GeoJSON FeatureCollection veya JSON Array...\n\nÖrnek:\n{"features":[{"properties":{"ParselNo":"2","Ada":"1115",...}}]}`}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 flex items-start rounded-xl bg-red-50 p-4 text-sm text-red-700 shadow-sm border border-red-100">
                            <AlertCircle className="mr-3 h-5 w-5 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center gap-3 border-t border-slate-100 bg-white p-5">
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-2"
                    >
                        İptal
                    </button>
                    <button
                        onClick={mode === "manual" ? handleManualSubmit : handleJsonSubmit}
                        disabled={loading || (mode === "manual" ? false : !jsonInput)}
                        className="flex items-center justify-center rounded-xl bg-[#0071e3] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] shadow-lg shadow-[#0071e3]/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        {mode === "manual" ? "Kaydet" : "Yükle ve Kaydet"}
                    </button>
                </div>
            </div>
        </div>
    );
}

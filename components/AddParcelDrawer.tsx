"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Check, AlertCircle, Loader2, FileJson, FormInput, DatabaseZap, ChevronDown } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { useToast } from "@/components/ui/Toast";
import { PARCEL_CATEGORIES } from "@/lib/validations";
import clsx from "clsx";

interface TkgmItem { id: number; text: string; }

const IL_LIST: TkgmItem[] = [{"text":"Adana","id":23},{"text":"Adıyaman","id":24},{"text":"Afyonkarahisar","id":25},{"text":"Ağrı","id":26},{"text":"Amasya","id":27},{"text":"Ankara","id":28},{"text":"Antalya","id":29},{"text":"Artvin","id":30},{"text":"Aydın","id":31},{"text":"Balıkesir","id":32},{"text":"Bilecik","id":33},{"text":"Bingöl","id":34},{"text":"Bitlis","id":35},{"text":"Bolu","id":36},{"text":"Burdur","id":37},{"text":"Bursa","id":38},{"text":"Çanakkale","id":39},{"text":"Çankırı","id":40},{"text":"Çorum","id":41},{"text":"Denizli","id":42},{"text":"Diyarbakır","id":43},{"text":"Edirne","id":44},{"text":"Elazığ","id":45},{"text":"Erzincan","id":46},{"text":"Erzurum","id":47},{"text":"Eskişehir","id":48},{"text":"Gaziantep","id":49},{"text":"Giresun","id":50},{"text":"Gümüşhane","id":51},{"text":"Hakkari","id":52},{"text":"Hatay","id":53},{"text":"Isparta","id":54},{"text":"Mersin","id":55},{"text":"İstanbul","id":56},{"text":"İzmir","id":57},{"text":"Kars","id":58},{"text":"Kastamonu","id":59},{"text":"Kayseri","id":60},{"text":"Kırklareli","id":61},{"text":"Kırşehir","id":62},{"text":"Kocaeli","id":63},{"text":"Konya","id":64},{"text":"Kütahya","id":65},{"text":"Malatya","id":66},{"text":"Manisa","id":67},{"text":"Kahramanmaraş","id":68},{"text":"Mardin","id":69},{"text":"Muğla","id":70},{"text":"Muş","id":71},{"text":"Nevşehir","id":72},{"text":"Niğde","id":73},{"text":"Ordu","id":74},{"text":"Rize","id":75},{"text":"Sakarya","id":76},{"text":"Samsun","id":77},{"text":"Siirt","id":78},{"text":"Sinop","id":79},{"text":"Sivas","id":80},{"text":"Tekirdağ","id":81},{"text":"Tokat","id":82},{"text":"Trabzon","id":83},{"text":"Tunceli","id":84},{"text":"Şanlıurfa","id":85},{"text":"Uşak","id":86},{"text":"Van","id":87},{"text":"Yozgat","id":88},{"text":"Zonguldak","id":89},{"text":"Aksaray","id":90},{"text":"Bayburt","id":91},{"text":"Karaman","id":92},{"text":"Kırıkkale","id":93},{"text":"Batman","id":94},{"text":"Şırnak","id":95},{"text":"Bartın","id":96},{"text":"Ardahan","id":97},{"text":"Iğdır","id":98},{"text":"Yalova","id":99},{"text":"Karabük","id":100},{"text":"Kilis","id":101},{"text":"Osmaniye","id":102},{"text":"Düzce","id":103}].sort((a,b)=>a.text.localeCompare(b.text,"tr"));

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
    askingPrice: string;
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
    const [tkgmLoading, setTkgmLoading] = useState(false);
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
        askingPrice: "",
        latitude: "",
        longitude: "",
        category: "UNCATEGORIZED",
        tags: "",
    });
    const [tkgmIlId, setTkgmIlId] = useState<number | null>(null);
    const [tkgmIlceId, setTkgmIlceId] = useState<number | null>(null);
    const [tkgmMahalleId, setTkgmMahalleId] = useState<number | null>(null);
    const [ilceList, setIlceList] = useState<TkgmItem[]>([]);
    const [mahalleList, setMahalleList] = useState<TkgmItem[]>([]);
    const [ilceLoading, setIlceLoading] = useState(false);
    const [mahalleLoading, setMahalleLoading] = useState(false);

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

    const canFetchTKGM = tkgmMahalleId != null && formData.island.trim() && formData.parsel.trim();

    const onIlChange = async (ilId: number, ilText: string) => {
        setTkgmIlId(ilId);
        setTkgmIlceId(null);
        setTkgmMahalleId(null);
        setIlceList([]);
        setMahalleList([]);
        setFormData(prev => ({ ...prev, city: ilText, district: "", neighborhood: "" }));
        setIlceLoading(true);
        try {
            const res = await fetch(`/api/tkgm/ilceler/${ilId}`);
            const data = await res.json();
            setIlceList(Array.isArray(data) ? data : []);
        } catch { setIlceList([]); }
        finally { setIlceLoading(false); }
    };

    const onIlceChange = async (ilceId: number, ilceText: string) => {
        setTkgmIlceId(ilceId);
        setTkgmMahalleId(null);
        setMahalleList([]);
        setFormData(prev => ({ ...prev, district: ilceText, neighborhood: "" }));
        setMahalleLoading(true);
        try {
            const res = await fetch(`/api/tkgm/mahalleler/${ilceId}`);
            const data = await res.json();
            setMahalleList(Array.isArray(data) ? data : []);
        } catch { setMahalleList([]); }
        finally { setMahalleLoading(false); }
    };

    const onMahalleChange = (mahalleId: number, mahalleText: string) => {
        setTkgmMahalleId(mahalleId);
        setFormData(prev => ({ ...prev, neighborhood: mahalleText }));
    };

    const fetchFromTKGM = async () => {
        if (!tkgmMahalleId) return;
        setTkgmLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                mahalleId: String(tkgmMahalleId),
                ada: formData.island.trim(),
                parsel: formData.parsel.trim(),
            });

            const res = await fetch(`/api/tkgm/lookup?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "TKGM sorgusu başarısız");

            setFormData(prev => ({
                ...prev,
                area: data.area != null ? String(data.area) : prev.area,
                latitude: data.latitude != null ? String(data.latitude) : prev.latitude,
                longitude: data.longitude != null ? String(data.longitude) : prev.longitude,
            }));

            const nitelik = data.nitelik ? ` (${data.nitelik})` : "";
            toast.success("TKGM Verisi Alındı", `Alan ve koordinatlar dolduruldu${nitelik}.`);
        } catch (err: any) {
            setError(err.message);
            toast.error("TKGM Hatası", err.message);
        } finally {
            setTkgmLoading(false);
        }
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
                askingPrice: formData.askingPrice ? parseFloat(formData.askingPrice) : null,
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
                askingPrice: "",
                latitude: "",
                longitude: "",
                category: "UNCATEGORIZED",
                tags: "",
            });
            setTkgmIlId(null); setTkgmIlceId(null); setTkgmMahalleId(null);
            setIlceList([]); setMahalleList([]);

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
                    let geometry: string | null = null;

                    if (f.geometry && f.geometry.coordinates) {
                        if (f.geometry.type === "Point") {
                            lon = f.geometry.coordinates[0];
                            lat = f.geometry.coordinates[1];
                        } else if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
                            // Save the full polygon geometry
                            geometry = JSON.stringify(f.geometry);
                            // Derive center point from polygon centroid
                            const coords = f.geometry.type === "Polygon"
                                ? f.geometry.coordinates[0]
                                : f.geometry.coordinates[0][0];
                            const lats = coords.map((c: number[]) => c[1]);
                            const lons = coords.map((c: number[]) => c[0]);
                            lat = (Math.min(...lats) + Math.max(...lats)) / 2;
                            lon = (Math.min(...lons) + Math.max(...lons)) / 2;
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
                        askingPrice: parseNumber(findProp(p, ["AskingPrice", "Fiyat", "ilanFiyati", "fiyat", "askingPrice"])),
                        latitude: lat,
                        longitude: lon,
                        geometry,
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
                    askingPrice: parseNumber(findProp(item, ["AskingPrice", "Fiyat", "ilanFiyati", "fiyat", "askingPrice"])),
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
                                        <div className="relative">
                                            <select
                                                value={tkgmIlId ?? ""}
                                                onChange={e => {
                                                    const id = Number(e.target.value);
                                                    const il = IL_LIST.find(i => i.id === id);
                                                    if (il) onIlChange(il.id, il.text);
                                                }}
                                                className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50 pr-8"
                                            >
                                                <option value="">İl seçin</option>
                                                {IL_LIST.map(il => <option key={il.id} value={il.id}>{il.text}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">İlçe</label>
                                        <div className="relative">
                                            <select
                                                value={tkgmIlceId ?? ""}
                                                onChange={e => {
                                                    const id = Number(e.target.value);
                                                    const ilce = ilceList.find(i => i.id === id);
                                                    if (ilce) onIlceChange(ilce.id, ilce.text);
                                                }}
                                                disabled={!tkgmIlId || ilceLoading}
                                                className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50 pr-8 disabled:opacity-50"
                                            >
                                                <option value="">{ilceLoading ? "Yükleniyor…" : "İlçe seçin"}</option>
                                                {ilceList.map(i => <option key={i.id} value={i.id}>{i.text}</option>)}
                                            </select>
                                            {ilceLoading ? <Loader2 className="absolute right-2 top-3 h-4 w-4 text-slate-400 animate-spin" /> : <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mahalle</label>
                                    <div className="relative">
                                        <select
                                            value={tkgmMahalleId ?? ""}
                                            onChange={e => {
                                                const id = Number(e.target.value);
                                                const m = mahalleList.find(i => i.id === id);
                                                if (m) onMahalleChange(m.id, m.text);
                                            }}
                                            disabled={!tkgmIlceId || mahalleLoading}
                                            className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50 pr-8 disabled:opacity-50"
                                        >
                                            <option value="">{mahalleLoading ? "Yükleniyor…" : "Mahalle seçin"}</option>
                                            {mahalleList.map(m => <option key={m.id} value={m.id}>{m.text}</option>)}
                                        </select>
                                        {mahalleLoading ? <Loader2 className="absolute right-2 top-3 h-4 w-4 text-slate-400 animate-spin" /> : <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />}
                                    </div>
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
                                <div className="rounded-xl border border-[#0071e3]/20 bg-[#0071e3]/5 p-3 space-y-2.5">
                                    <p className="text-xs font-semibold text-[#0071e3] flex items-center gap-1.5">
                                        <DatabaseZap className="h-3.5 w-3.5" />
                                        TKGM'den Otomatik Doldur
                                    </p>
                                    {tkgmMahalleId ? (
                                        <p className="text-[11px] text-[#0071e3]/80 bg-[#0071e3]/10 rounded-lg px-2.5 py-1.5">
                                            Mahalle seçildi. Ada ve Parsel numarasını girin, ardından sorgulayın.
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-slate-500">
                                            Yukarıdan İl → İlçe → Mahalle seçin, ardından ada/parsel girerek alan ve koordinatları otomatik doldurun.
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={fetchFromTKGM}
                                        disabled={!canFetchTKGM || tkgmLoading}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-medium text-white hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {tkgmLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseZap className="h-3.5 w-3.5" />}
                                        {tkgmLoading ? "Sorgulanıyor..." : "Alan / Koordinat Getir"}
                                    </button>
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        İlan / Talep Fiyatı (TL) <span className="text-slate-400 font-normal">— Opsiyonel</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.askingPrice}
                                        onChange={(e) => handleFormChange("askingPrice", e.target.value)}
                                        placeholder="2500000"
                                        step="1"
                                        min="0"
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-colors bg-slate-50/50"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Sahibinin/danışmanın istediği fiyat. Bölgesel değerlemede emsal olarak kullanılır.</p>
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

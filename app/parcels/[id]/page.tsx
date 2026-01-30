"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, ArrowLeft, Building, Loader2, FileText, ExternalLink, History, Share2, MoreVertical, ChevronRight, Layers, Maximize2, Info, Download, Calculator, Users, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import ZoningEditSection from "@/components/ZoningEditSection";
import CRMSection from "@/components/CRMSection";
import FeasibilitySection from "@/components/FeasibilitySection";
import ProcessTimeline from "@/components/ProcessTimeline";
import Modal from "@/components/ui/Modal";
import ParcelReportTemplate from "@/components/ParcelReportTemplate";
import ImageUploadSection from "@/components/ImageUploadSection";
import DocumentUploadSection from "@/components/DocumentUploadSection";
import ParcelTaskList from "@/components/ParcelTaskList";

export default function ParcelDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [parcel, setParcel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processStage, setProcessStage] = useState("NEW_LEAD");
    const [isZoningModalOpen, setIsZoningModalOpen] = useState(false);
    const [feasibilityData, setFeasibilityData] = useState<any>(null);
    const [images, setImages] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);

    const fetchParcel = useCallback(async () => {
        try {
            const res = await fetch(`/api/parcels/${params.id}`);
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setParcel(data);
            if (data.crmStage) {
                setProcessStage(data.crmStage);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    const fetchImages = useCallback(async () => {
        try {
            const res = await fetch(`/api/parcels/${params.id}/images`);
            if (res.ok) {
                const data = await res.json();
                setImages(data);
            }
        } catch (err) {
            console.error("Fetch images error:", err);
        }
    }, [params.id]);

    const fetchDocuments = useCallback(async () => {
        try {
            const res = await fetch(`/api/parcels/${params.id}/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (err) {
            console.error("Fetch documents error:", err);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            fetchParcel();
            fetchImages();
            fetchDocuments();
        }
    }, [params.id, fetchParcel]);

    const handleStageChange = async (newStage: string) => {
        // ... (stage logic same)
        setProcessStage(newStage);
        try {
            await fetch(`/api/parcels/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crmStage: newStage })
            });
        } catch (e) {
            console.error("Failed to update stage", e);
        }
    };

    const handleDownloadReport = () => {
        const originalTitle = document.title;
        document.title = `Parsel_Rapor_${parcel.city}_${parcel.parsel}`;
        window.print();
        document.title = originalTitle;
    };

    if (loading) {
        // ...
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!parcel) {
        // ...
        return (
            <div className="flex flex-col items-center justify-center h-full pt-20">
                <h2 className="text-xl font-bold text-gray-900">Parsel Bulunamadı</h2>
                <Link href="/" className="mt-4 text-emerald-600 hover:underline flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Link>
            </div>
        );
    }

    // Prioritize user-uploaded default image, fall back to any image
    const defaultImage = images.find(img => img.isDefault);
    const mainImage = defaultImage?.url || (images.length > 0 ? images[0].url : null);

    // Fallback to placeholder if no image
    const displayImage = mainImage || '/placeholder-parcel.jpg';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            {/* PRINTABLE REPORT TEMPLATE (Hidden normally, visible on print) */}
            <div className="hidden print:block absolute top-0 left-0 w-full z-50 bg-white">
                <ParcelReportTemplate parcel={parcel} feasibilityResult={feasibilityData} />
            </div>

            {/* MAIN INTERACTIVE UI (Hidden on print) */}
            <div className="print:hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    {/* ... Header Content ... */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-purple-600 hidden md:block" />
                                {parcel.district}, {parcel.neighborhood}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5 md:ml-7">Ada: {parcel.island} | Parsel: {parcel.parsel}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs text-gray-500 font-medium">Durum</span>
                            <span className={`text-sm font-bold px-2 py-0.5 rounded-full border ${parcel.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                parcel.status === 'RESEARCHING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                {parcel.status === "PENDING" ? "Bekliyor" : parcel.status}
                            </span>
                        </div>
                        <Link
                            href={`/parcels/${params.id}/presentation`}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                            title="Yatırımcı Sunumu"
                        >
                            <Share2 className="h-5 w-5" />
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Link href="/" className="hover:text-gray-600">Parseller</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-gray-600">{parcel.city}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-purple-600">Detay</span>
                    </div>

                    {/* 1. Process Timeline */}
                    <ProcessTimeline currentStage={processStage} onStageChange={handleStageChange} />

                    {/* Tabs Navigation */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-6">
                            <TabsTrigger value="general" icon={<Info className="h-4 w-4" />}>
                                Genel Bilgiler
                            </TabsTrigger>
                            <TabsTrigger value="feasibility" icon={<Calculator className="h-4 w-4" />}>
                                Müteahhit Hesabı
                            </TabsTrigger>
                            <TabsTrigger value="crm" icon={<Users className="h-4 w-4" />}>
                                CRM & Müşteriler
                            </TabsTrigger>
                            <TabsTrigger value="documents" icon={<FolderOpen className="h-4 w-4" />}>
                                Dökümanlar
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Content: General Info */}
                        <TabsContent value="general">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                                {/* LEFT COLUMN: Main Visuals & Actions */}
                                <div className="lg:col-span-3 space-y-8">
                                    {/* Main Info Card */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                                        <div className="h-[300px] md:h-[400px] w-full bg-gray-100 relative group-hover:shadow-inner transition-all">
                                            <img
                                                src={displayImage}
                                                alt="Parcel View"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    const target = e.target as HTMLImageElement;
                                                    if (target.src !== '/placeholder-parcel.jpg') {
                                                        target.src = '/placeholder-parcel.jpg';
                                                    }
                                                }}
                                            />
                                            <div className="absolute bottom-4 left-4 flex gap-2">
                                                <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 shadow-sm border border-gray-200 flex items-center gap-1">
                                                    <Maximize2 className="w-3 h-3" /> {parcel.area ? `${parcel.area} m²` : 'Alan Yok'}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-4 right-4 print:hidden">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${parcel.city}+${parcel.district}+Ada+${parcel.island}+Parsel+${parcel.parsel}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-white/90 backdrop-blur-sm text-gray-700 font-medium text-xs px-3 py-2 rounded-lg shadow-sm hover:bg-white flex items-center transition-colors"
                                                >
                                                    Google Maps <ExternalLink className="ml-1 h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                        {/* Zoning Summary Bar */}
                                        <div className="bg-white p-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-100">
                                            <div className="px-4 text-center">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Emsal (KAKS)</div>
                                                <div className="text-2xl font-black text-gray-800 tracking-tight">{parcel.zoning?.ks || '-'}</div>
                                            </div>
                                            <div className="px-4 text-center">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Gabari (Hmax)</div>
                                                <div className="text-2xl font-black text-gray-800 tracking-tight">{parcel.zoning?.maxHeight || '-'}</div>
                                            </div>
                                            <div className="px-4 text-center">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Fonksiyon</div>
                                                <div className="text-lg font-bold text-purple-600 truncate">{parcel.zoning?.zoningType || 'Konut'}</div>
                                            </div>
                                            <div className="px-4 text-center flex flex-col items-center justify-center">
                                                <button
                                                    onClick={handleDownloadReport}
                                                    className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors w-full flex items-center justify-center gap-1"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    Rapor İndir (Yazdır)
                                                </button>
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                {/* RIGHT COLUMN: Edit & Details Sidebar */}
                                <div className="space-y-6">

                                    {/* Info Card */}
                                    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                            <Building className="mr-2 h-4 w-4 text-emerald-500" />
                                            Künye
                                        </h3>
                                        <dl className="divide-y divide-gray-100 text-sm">
                                            <div className="py-3 flex justify-between">
                                                <dt className="text-gray-500">İl</dt>
                                                <dd className="font-medium text-gray-900">{parcel.city}</dd>
                                            </div>
                                            <div className="py-3 flex justify-between">
                                                <dt className="text-gray-500">İlçe</dt>
                                                <dd className="font-medium text-gray-900">{parcel.district}</dd>
                                            </div>
                                            <div className="py-3 flex justify-between">
                                                <dt className="text-gray-500">Mahalle</dt>
                                                <dd className="font-medium text-gray-900">{parcel.neighborhood}</dd>
                                            </div>
                                            <div className="py-3 flex justify-between">
                                                <dt className="text-gray-500">Ada</dt>
                                                <dd className="font-medium text-gray-900">{parcel.island}</dd>
                                            </div>
                                            <div className="py-3 flex justify-between">
                                                <dt className="text-gray-500">Parsel</dt>
                                                <dd className="font-medium text-gray-900">{parcel.parsel}</dd>
                                            </div>
                                            <div className="py-3 flex justify-between">
                                                <dt className="text-gray-500">Yüz Ölçümü</dt>
                                                <dd className="font-medium text-gray-900">{parcel.area ? `${parcel.area} m²` : '-'}</dd>
                                            </div>
                                        </dl>
                                    </div>

                                    {/* Zoning Info & Manual Edit Trigger */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center">
                                                <Info className="mr-2 h-4 w-4 text-emerald-500" />
                                                Manuel İmar Verisi
                                            </h3>
                                            <button
                                                onClick={() => setIsZoningModalOpen(true)}
                                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                                            >
                                                Düzenle
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <span className="text-xs text-gray-500">Fonksiyon</span>
                                                <span className="text-sm font-bold text-gray-900">{parcel.zoning?.zoningType || '-'}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                                    <div className="text-[10px] text-gray-400 mb-1">Emsal</div>
                                                    <div className="text-sm font-bold text-gray-900">{parcel.zoning?.ks || '-'}</div>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                                    <div className="text-[10px] text-gray-400 mb-1">TAKS</div>
                                                    <div className="text-sm font-bold text-gray-900">{parcel.zoning?.taks || '-'}</div>
                                                </div>
                                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                                    <div className="text-[10px] text-gray-400 mb-1">Hmax</div>
                                                    <div className="text-sm font-bold text-gray-900">{parcel.zoning?.maxHeight || '-'}</div>
                                                </div>
                                            </div>
                                            {parcel.zoning?.notes && (
                                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800 italic">
                                                    "{parcel.zoning.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Precedents (Emsal) - Placeholder since component is missing */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                        <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b border-gray-100 pb-2">
                                            <History className="w-5 h-5 text-purple-600" />
                                            <span>Bölge Emsalleri</span>
                                        </div>
                                        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                            <span className="text-xs text-gray-400 font-medium">Bu bölge için henüz emsal kaydı bulunamadı.</span>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-400" /> Notlar
                                        </h3>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {parcel.notes?.map((note: any) => (
                                                <div key={note.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-900 shadow-sm relative group">
                                                    <p>{note.content}</p>
                                                    <span className="text-[10px] text-yellow-600/70 mt-2 block text-right">{new Date(note.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                            {(!parcel.notes || parcel.notes.length === 0) && (
                                                <p className="text-xs text-gray-400 italic text-center py-4">Henüz not eklenmemiş.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Image Upload Section */}
                                    <ImageUploadSection
                                        parcelId={parcel.id}
                                        images={images}
                                        onUploadSuccess={() => {
                                            fetchImages();
                                            fetchParcel(); // Refresh parcel for main image update
                                        }}
                                    />

                                    {/* Document Upload Section */}
                                    <DocumentUploadSection
                                        parcelId={parcel.id}
                                        documents={documents}
                                        onUploadSuccess={fetchDocuments}
                                    />

                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab Content: Feasibility */}
                        <TabsContent value="feasibility">
                            <div className="max-w-5xl mx-auto">
                                <FeasibilitySection
                                    parcelId={parcel.id}
                                    parcelArea={parcel.area || 0}
                                    initialKs={parcel.zoning?.ks}
                                    initialTaks={parcel.zoning?.taks}
                                    onCalculateSuccess={(data) => setFeasibilityData(data)}
                                />
                            </div>
                        </TabsContent>

                        {/* Tab Content: CRM */}
                        <TabsContent value="crm">
                            <div className="max-w-5xl mx-auto">
                                <CRMSection parcelId={parcel.id} />
                                <ParcelTaskList parcelId={parcel.id} />
                            </div>
                        </TabsContent>

                        {/* Tab Content: Documents */}
                        <TabsContent value="documents">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                                <ImageUploadSection
                                    parcelId={parcel.id}
                                    images={images}
                                    onUploadSuccess={() => {
                                        fetchImages();
                                        fetchParcel();
                                    }}
                                />
                                <DocumentUploadSection
                                    parcelId={parcel.id}
                                    documents={documents}
                                    onUploadSuccess={fetchDocuments}
                                />
                            </div>
                        </TabsContent>

                    </Tabs>
                </main>

                {/* Zoning Edit Modal */}
                <Modal
                    isOpen={isZoningModalOpen}
                    onClose={() => setIsZoningModalOpen(false)}
                    title="Manuel İmar Verisi Girişi"
                    maxWidth="lg"
                >
                    <div className="-mt-6">
                        <ZoningEditSection
                            parcelId={parcel.id}
                            city={parcel.city}
                            district={parcel.district}
                            neighborhood={parcel.neighborhood}
                            parcelArea={parcel.area}
                            initialZoning={parcel.zoning}
                            onUpdate={() => {
                                fetchParcel();
                                setIsZoningModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            </div>
        </div>
    );
}

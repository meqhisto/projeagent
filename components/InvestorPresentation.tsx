"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Share2, Eye, Loader2, Copy, Check, Link2, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Sunum sayfaları
import CoverPage from "./PresentationPages/CoverPage";
import LocationPage from "./PresentationPages/LocationPage";
import GalleryPage from "./PresentationPages/GalleryPage";
import RegionalAnalysisPage from "./PresentationPages/RegionalAnalysisPage";
import FeasibilityPage from "./PresentationPages/FeasibilityPage";
// ProposalPage kaldırıldı
import ContactPage from "./PresentationPages/ContactPage";

interface PresentationData {
    parcel: any;
    images: any[];
    zoning: any;
    notes: any[];
    feasibility: any;
    regionalData: any[];
    userPrecedents: any[];
    userSettings: {
        companyName: string;
        email: string;
        phone: string | null;
        logoUrl: string | null;
        address: string | null;
        website: string | null;
    };
    generatedAt: string;
}

interface ShareLink {
    id: number;
    token: string;
    shareUrl: string;
    title?: string;
    viewCount: number;
    isActive: boolean;
    createdAt: string;
}

interface InvestorPresentationProps {
    parcelId: number;
}

export default function InvestorPresentation({ parcelId }: InvestorPresentationProps) {
    const [data, setData] = useState<PresentationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTitle, setShareTitle] = useState("");
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const presentationRef = useRef<HTMLDivElement>(null);

    // Veri yükle
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/parcels/${parcelId}/presentation`);
                if (res.ok) {
                    const presentationData = await res.json();
                    setData(presentationData);
                }
            } catch (error) {
                console.error("Fetch presentation data error:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchShareLinks = async () => {
            try {
                const res = await fetch(`/api/parcels/${parcelId}/presentation/share`);
                if (res.ok) {
                    const links = await res.json();
                    setShareLinks(links);
                }
            } catch (error) {
                console.error("Fetch share links error:", error);
            }
        };

        fetchData();
        fetchShareLinks();
    }, [parcelId]);

    // PDF export
    const handleExportPDF = async () => {
        if (!presentationRef.current) return;

        setExportLoading(true);
        try {
            // Dynamic import for html2pdf (client-side only)
            const html2pdf = (await import("html2pdf.js")).default;

            const element = presentationRef.current;
            const opt = {
                margin: 0,
                filename: `Yatirimci_Sunumu_${data?.parcel.city}_${data?.parcel.district}_${data?.parcel.island}_${data?.parcel.parsel}.pdf`,
                image: { type: "jpeg" as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
                pagebreak: { mode: ["avoid-all", "css", "legacy"] }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF export error:", error);
            alert("PDF oluşturulurken bir hata oluştu.");
        } finally {
            setExportLoading(false);
        }
    };

    // Paylaşım linki oluştur
    const handleCreateShareLink = async () => {
        try {
            const res = await fetch(`/api/parcels/${parcelId}/presentation/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: shareTitle || null })
            });

            if (res.ok) {
                const newShare = await res.json();
                setShareLinks([newShare, ...shareLinks]);
                setShareTitle("");
                setShowShareModal(false);
            }
        } catch (error) {
            console.error("Create share link error:", error);
        }
    };

    // Linki kopyala
    const handleCopyLink = async (shareUrl: string, id: number) => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Copy error:", error);
        }
    };

    // Linki deaktive et
    const handleDeleteLink = async (shareId: number) => {
        try {
            const res = await fetch(`/api/parcels/${parcelId}/presentation/share?shareId=${shareId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setShareLinks(shareLinks.map(link =>
                    link.id === shareId ? { ...link, isActive: false } : link
                ));
            }
        } catch (error) {
            console.error("Delete share link error:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12 text-gray-500">
                Sunum verileri yüklenemedi.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Kontrol Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Yatırımcı Sunumu</h2>
                        <p className="text-sm text-gray-500">
                            {data.parcel.city}, {data.parcel.district} - Ada: {data.parcel.island}, Parsel: {data.parcel.parsel}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Share2 className="h-4 w-4" />
                            Paylaş
                        </button>

                        <button
                            onClick={handleExportPDF}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {exportLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            PDF İndir
                        </button>
                    </div>
                </div>
            </div>

            {/* Paylaşım Linkleri */}
            {shareLinks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-gray-500" />
                        Paylaşım Linkleri
                    </h3>
                    <div className="space-y-2">
                        {shareLinks.map(link => (
                            <div
                                key={link.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${link.isActive ? "bg-gray-50 border-gray-200" : "bg-red-50 border-red-200 opacity-60"
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={link.shareUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline truncate"
                                        >
                                            {link.shareUrl}
                                        </a>
                                        {!link.isActive && (
                                            <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                                Deaktif
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        <span>{new Date(link.createdAt).toLocaleDateString('tr-TR')}</span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            {link.viewCount} görüntülenme
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopyLink(link.shareUrl, link.id)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {copiedId === link.id ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                    {link.isActive && (
                                        <button
                                            onClick={() => handleDeleteLink(link.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sunum Önizleme */}
            <div
                ref={presentationRef}
                className="bg-white shadow-lg rounded-xl overflow-hidden"
                style={{ maxWidth: "210mm", margin: "0 auto" }}
            >
                <CoverPage data={data} />
                <LocationPage data={data} />
                <GalleryPage data={data} />
                {data.regionalData.length > 0 && <RegionalAnalysisPage data={data} />}
                {data.feasibility && <FeasibilityPage data={data} />}

                <ContactPage data={data} />
            </div>

            {/* Paylaşım Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Paylaşım Linki Oluştur</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Başlık (Opsiyonel)
                                </label>
                                <input
                                    type="text"
                                    value={shareTitle}
                                    onChange={(e) => setShareTitle(e.target.value)}
                                    placeholder="Örn: Yatırımcı Ahmet Bey için"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    💡 Oluşturduğunuz link herkes tarafından görüntülenebilir. İstediğiniz zaman deaktif edebilirsiniz.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCreateShareLink}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Link2 className="h-4 w-4" />
                                    Oluştur
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

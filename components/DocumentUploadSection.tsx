"use client";

import { useState, useRef } from "react";
import { FileText, Upload, X, Download, File } from "lucide-react";

interface DocumentUploadSectionProps {
    parcelId: number;
    documents: any[];
    onUploadSuccess: () => void;
}

export default function DocumentUploadSection({ parcelId, documents, onUploadSuccess }: DocumentUploadSectionProps) {
    const [uploading, setUploading] = useState(false);
    const [docName, setDocName] = useState("");
    const [description, setDescription] = useState("");
    const [showUploadForm, setShowUploadForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!selectedFile || !docName.trim()) {
            alert("Lütfen dosya seçin ve isim girin");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("name", docName);
            if (description) formData.append("description", description);

            const res = await fetch(`/api/parcels/${parcelId}/documents`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                onUploadSuccess();
                setSelectedFile(null);
                setDocName("");
                setDescription("");
                setShowUploadForm(false);
            } else {
                const error = await res.json();
                alert(error.error || "Yükleme başarısız");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Yükleme başarısız");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId: number) => {
        if (!confirm("Bu belgeyi silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/parcels/${parcelId}/documents?documentId=${documentId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                onUploadSuccess();
            } else {
                alert("Silme başarısız");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Silme başarısız");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes("pdf")) return "📄";
        if (fileType.includes("word")) return "📝";
        if (fileType.includes("excel") || fileType.includes("sheet")) return "📊";
        return "📁";
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Belgeler
                </h3>
                <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                >
                    {showUploadForm ? "İptal" : "+ Belge Ekle"}
                </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Dosya</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full text-sm"
                        />
                        {selectedFile && (
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Belge Adı *</label>
                        <input
                            type="text"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="örn: İmar Planı"
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Açıklama (opsiyonel)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Belge hakkında notlar..."
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg"
                            rows={2}
                        />
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile || !docName.trim()}
                        className="w-full bg-purple-700 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? "Yükleniyor..." : "Yükle"}
                    </button>
                </div>
            )}

            {/* Document List */}
            {documents.length > 0 ? (
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors group"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString('tr-TR')}
                                    </p>
                                    {doc.description && (
                                        <p className="text-xs text-gray-400 italic mt-1">{doc.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={doc.filePath}
                                    download
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-600"
                                    aria-label="İndir"
                                    title="İndir"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:ring-2 focus-visible:ring-red-600"
                                    aria-label="Sil"
                                    title="Sil"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-gray-400 py-4">Henüz belge yüklenmemiş</p>
            )}
        </div>
    );
}

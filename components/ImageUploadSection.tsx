"use client";

import { useState, useRef } from "react";
import { Upload, X, Star, Image as ImageIcon } from "lucide-react";

interface ImageUploadSectionProps {
    parcelId: number;
    images: any[];
    onUploadSuccess: () => void;
}

export default function ImageUploadSection({ parcelId, images, onUploadSuccess }: ImageUploadSectionProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        await uploadImage(file, false);
    };

    const uploadImage = async (file: File, setAsDefault: boolean) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("setAsDefault", setAsDefault.toString());

            const res = await fetch(`/api/parcels/${parcelId}/images`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                onUploadSuccess();
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

    const handleDelete = async (imageId: number) => {
        if (!confirm("Bu görseli silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/parcels/${parcelId}/images?imageId=${imageId}`, {
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

    const handleSetDefault = async (imageId: number) => {
        try {
            // Re-upload with setAsDefault flag would be complex, 
            // so let's create a separate PATCH endpoint or handle via DB directly
            // For now, user can delete and re-upload as default
            alert("Ana görsel yapmak için: görseli silin ve 'Ana Görsel Olarak Ayarla' işaretli şekilde tekrar yükleyin.");
        } catch (error) {
            console.error(error);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    // Filter user-uploaded images
    const userImages = images.filter(img => img.source === "USER" || img.type === "UPLOADED");

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                Görseller
            </h3>

            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300 bg-gray-50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className={`h-8 w-8 mx-auto mb-2 ${dragActive ? "text-purple-600" : "text-gray-400"}`} />
                <p className="text-sm text-gray-600 mb-1">Görseli sürükleyip bırakın veya tıklayın</p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP (Max 5MB)</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </div>

            {/* Options */}
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer">
                <input type="checkbox" className="rounded" id="setAsDefaultCheckbox" />
                <span>Ana görsel olarak ayarla</span>
            </label>

            {uploading && (
                <div className="text-center py-2 text-sm text-purple-600">Yükleniyor...</div>
            )}

            {/* Image Grid */}
            {userImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {userImages.map((image) => (
                        <div key={image.id} className="relative group">
                            <img
                                src={image.url}
                                alt="Parcel"
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            {image.isDefault && (
                                <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full">
                                    <Star className="h-3 w-3 fill-current" />
                                </div>
                            )}
                            <button
                                onClick={() => handleDelete(image.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
                                aria-label="Sil"
                                title="Sil"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-gray-400 py-4">Henüz görsel yüklenmemiş</p>
            )}
        </div>
    );
}

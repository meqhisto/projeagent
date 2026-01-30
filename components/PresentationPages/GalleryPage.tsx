import { Image as ImageIcon } from "lucide-react";

interface GalleryPageProps {
    data: {
        images: any[];
    };
}

export default function GalleryPage({ data }: GalleryPageProps) {
    const { images } = data;

    if (!images || images.length === 0) {
        return null;
    }

    // En fazla 6 görsel göster
    const displayImages = images.slice(0, 6);

    return (
        <div
            className="min-h-[297mm] bg-white p-12"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <ImageIcon className="h-6 w-6 text-purple-600" />
                    Görsel Galeri
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Parsel ve çevre görselleri
                </p>
            </div>

            {/* Gallery Grid */}
            <div className={`grid gap-4 ${displayImages.length === 1 ? 'grid-cols-1' :
                    displayImages.length === 2 ? 'grid-cols-2' :
                        displayImages.length <= 4 ? 'grid-cols-2' :
                            'grid-cols-3'
                }`}>
                {displayImages.map((image, index) => (
                    <div
                        key={image.id}
                        className={`relative rounded-xl overflow-hidden border border-gray-200 ${displayImages.length === 1 ? 'h-[500px]' :
                                displayImages.length === 2 ? 'h-[350px]' :
                                    'h-[200px]'
                            }`}
                    >
                        <img
                            src={image.url}
                            alt={`Görsel ${index + 1}`}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                        />

                        {/* Image Type Badge */}
                        <div className="absolute bottom-3 left-3">
                            <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                {image.type === 'SATELLITE' ? 'Uydu Görüntüsü' :
                                    image.type === 'MAP' ? 'Harita' :
                                        image.type === 'TKGM_PARCEL' ? 'Kadastro' :
                                            image.type === 'TKGM_NEIGHBORHOOD' ? 'Mahalle' :
                                                'Fotoğraf'}
                            </span>
                        </div>

                        {/* Default Badge */}
                        {image.isDefault && (
                            <div className="absolute top-3 right-3">
                                <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                                    Ana Görsel
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* More images note */}
            {images.length > 6 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                    +{images.length - 6} görsel daha mevcut
                </div>
            )}
        </div>
    );
}

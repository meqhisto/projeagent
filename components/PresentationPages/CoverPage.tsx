import type { Parcel, ParcelImage, PresentationUserSettings } from "@/types";

interface CoverPageProps {
    data: {
        parcel: Parcel;
        images: ParcelImage[];
        userSettings: PresentationUserSettings;
        generatedAt: string;
    };
}

export default function CoverPage({ data }: CoverPageProps) {
    const mainImage = data.images.find(img => img.isDefault)?.url || data.images[0]?.url;
    const date = new Date(data.generatedAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div
            className="relative h-[297mm] bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col"
            style={{ pageBreakAfter: "always" }}
        >
            {/* Background Image */}
            {mainImage && (
                <div className="absolute inset-0 opacity-30">
                    <img
                        src={mainImage}
                        alt="Parcel"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-12">
                {/* Main Content - Centered */}
                <div className="flex-1 flex flex-col items-center justify-center text-center text-white">
                    <div className="mb-6">
                        <span className="text-sm uppercase tracking-[0.3em] text-purple-300 font-medium">
                            Yatırımcı Sunumu
                        </span>
                    </div>

                    <h1 className="text-5xl font-bold mb-4 tracking-tight">
                        {data.parcel.city}
                    </h1>

                    <h2 className="text-3xl font-light text-gray-300 mb-8">
                        {data.parcel.district}, {data.parcel.neighborhood}
                    </h2>

                    <div className="flex items-center gap-6 text-lg text-gray-400">
                        <span className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
                            Ada: <span className="font-bold text-white">{data.parcel.island}</span>
                        </span>
                        <span className="bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
                            Parsel: <span className="font-bold text-white">{data.parcel.parsel}</span>
                        </span>
                    </div>

                    {/* Yüzölçüm */}
                    {data.parcel.area && (
                        <div className="mt-8 text-2xl text-purple-300 font-medium">
                            {data.parcel.area.toLocaleString('tr-TR')} m²
                        </div>
                    )}

                    {/* Logo - Yüzölçüm altında */}
                    {data.userSettings.logoUrl && (
                        <div className="mt-10">
                            <img
                                src={data.userSettings.logoUrl}
                                alt="Logo"
                                className="h-16 object-contain mx-auto"
                                crossOrigin="anonymous"
                            />
                        </div>
                    )}

                    {/* Portföy Sahibi İsmi - Logo altında */}
                    {data.userSettings.companyName && (
                        <p className="mt-4 text-xl font-medium text-white">
                            {data.userSettings.companyName}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-end justify-center text-gray-400 text-sm">
                    <div className="text-center">
                        <p>{date}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

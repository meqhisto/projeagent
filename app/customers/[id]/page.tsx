"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Briefcase, MapPin, Calendar, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface Customer {
    id: number;
    name: string;
    role: string;
    phone?: string;
    email?: string;
    notes?: string;
    parcels?: any[];
    interactions?: any[];
    createdAt: string;
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchCustomer();
    }, [params.id]);

    const fetchCustomer = async () => {
        try {
            const res = await fetch(`/api/crm/customers/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setCustomer(data);
            }
        } catch (error) {
            console.error("Failed to fetch customer", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center h-full pt-20">
                <h2 className="text-xl font-bold text-gray-900">Müşteri Bulunamadı</h2>
                <Link href="/customers" className="mt-4 text-emerald-600 hover:underline flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Link>
            </div>
        );
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case "Land Owner": return "bg-blue-100 text-blue-700 border-blue-200";
            case "Investor": return "bg-purple-100 text-purple-700 border-purple-200";
            case "Agent": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-6 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => router.back()} className="mb-4 flex items-center text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(customer.role)}`}>
                                    {customer.role}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setEditMode(!editMode)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Edit className="h-4 w-4" />
                            Düzenle
                        </button>
                    </div>

                    {/* Quick Contact Info */}
                    <div className="mt-6 flex flex-wrap gap-4">
                        {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm font-medium">{customer.phone}</span>
                            </a>
                        )}
                        {customer.email && (
                            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm font-medium">{customer.email}</span>
                            </a>
                        )}
                        <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">Eklenme: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                        <TabsTrigger value="general" icon={<User className="h-4 w-4" />}>
                            Genel Bilgiler
                        </TabsTrigger>
                        <TabsTrigger value="parcels" icon={<MapPin className="h-4 w-4" />}>
                            İlişkili Parseller ({customer.parcels?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="history" icon={<Calendar className="h-4 w-4" />}>
                            Görüşme Geçmişi ({customer.interactions?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    {/* General Info Tab */}
                    <TabsContent value="general">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">İletişim Bilgileri</h2>
                            <dl className="space-y-4">
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <dt className="text-gray-500 font-medium">İsim</dt>
                                    <dd className="text-gray-900 font-semibold">{customer.name}</dd>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <dt className="text-gray-500 font-medium">Rol</dt>
                                    <dd className="text-gray-900 font-semibold">{customer.role}</dd>
                                </div>
                                {customer.phone && (
                                    <div className="flex justify-between py-3 border-b border-gray-100">
                                        <dt className="text-gray-500 font-medium">Telefon</dt>
                                        <dd className="text-gray-900 font-semibold">{customer.phone}</dd>
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex justify-between py-3 border-b border-gray-100">
                                        <dt className="text-gray-500 font-medium">E-posta</dt>
                                        <dd className="text-gray-900 font-semibold">{customer.email}</dd>
                                    </div>
                                )}
                            </dl>

                            {customer.notes && (
                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h3 className="text-sm font-bold text-yellow-900 mb-2">Notlar</h3>
                                    <p className="text-sm text-yellow-800">{customer.notes}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Parcels Tab */}
                    <TabsContent value="parcels">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customer.parcels && customer.parcels.length > 0 ? (
                                customer.parcels.map((parcel) => (
                                    <Link
                                        key={parcel.id}
                                        href={`/parcels/${parcel.id}`}
                                        className="block bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-200 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-emerald-600" />
                                                <h3 className="font-bold text-gray-900">{parcel.city}</h3>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{parcel.district}, {parcel.neighborhood}</p>
                                        <p className="text-xs text-gray-500 mt-2">Ada: {parcel.island} / Parsel: {parcel.parsel}</p>
                                        {parcel.area && (
                                            <p className="text-sm font-semibold text-purple-600 mt-2">{parcel.area} m²</p>
                                        )}
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-gray-400">
                                    Bu müşteriyle ilişkili parsel bulunmamaktadır.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <div className="space-y-4">
                            {customer.interactions && customer.interactions.length > 0 ? (
                                customer.interactions.map((interaction) => (
                                    <div key={interaction.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                                {interaction.type}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(interaction.date).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <p className="text-gray-700">{interaction.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    Henüz görüşme kaydı bulunmamaktadır.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

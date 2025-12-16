"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Lock, LogOut, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogout = async () => {
        setLoading(true);
        await signOut({ callbackUrl: "/login" });
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
                <p className="text-sm text-gray-500 mt-1">Profil ve hesap ayarlarınızı yönetin</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-gray-900">Profil Bilgileri</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İsim</label>
                        <input
                            type="text"
                            value={session.user.name || ""}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                        <input
                            type="email"
                            value={session.user.email || ""}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                    </div>

                    <div className="pt-2">
                        <p className="text-xs text-gray-500">
                            💡 Profil bilgilerini düzenlemek için yönetici ile iletişime geçin.
                        </p>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-gray-900">Güvenlik</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            Şifrenizi düzenlemek için lütfen yönetici ile iletişime geçin.
                        </p>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Güvenlik İpucu:</strong> Güçlü bir şifre kullanın ve düzenli olarak değiştirin.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">Oturumu Kapat</h3>
                        <p className="text-sm text-gray-500 mt-1">Hesabınızdan güvenli şekilde çıkış yapın</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Çıkış yapılıyor...
                            </>
                        ) : (
                            <>
                                <LogOut className="h-4 w-4" />
                                Çıkış Yap
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* System Info */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><strong>Sistem:</strong> ParselMonitor Pro v2.0</p>
                    <p className="text-gray-700"><strong>Kullanıcı ID:</strong> {session.user.id}</p>
                    <p className="text-gray-700"><strong>Giriş:</strong> {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
            </div>
        </div>
    );
}

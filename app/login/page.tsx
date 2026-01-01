"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, CheckCircle } from "lucide-react";

// Ana login içeriği - useSearchParams kullanan bileşen
function LoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [logoutSuccess, setLogoutSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Logout başarılı mesajını kontrol et
    useEffect(() => {
        if (searchParams.get("logout") === "success") {
            setLogoutSuccess(true);
            // 5 saniye sonra mesajı temizle ve URL'yi güncelle
            const timer = setTimeout(() => {
                setLogoutSuccess(false);
                // URL'den logout parametresini kaldır
                router.replace("/login", { scroll: false });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email veya şifre hatalı");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-purple-50">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

            <div className="w-full max-w-md p-8">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 items-center justify-center mb-4 shadow-lg">
                        <span className="text-2xl font-bold text-white">PM</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        PARSEL<span className="text-emerald-600">MONITOR</span>
                    </h1>
                    <p className="text-gray-600">Yönetim Paneline Giriş</p>
                </div>

                {/* Login Form */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                E-posta
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    placeholder="admin@parselmonitor.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Success Message - Logout */}
                        {logoutSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Çıkış işlemi başarılı. Güvenli bir şekilde oturumunuz kapatıldı.
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                    </form>

                    {/* Demo Info */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 font-medium mb-2">Demo Hesap Bilgileri:</p>
                        <p className="text-xs text-blue-700">Email: admin@parselmonitor.com</p>
                        <p className="text-xs text-blue-700">Şifre: admin123</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-500">
                    © 2024 ParselMonitor Pro v2.0
                </div>
            </div>
        </div>
    );
}

// Suspense wrapper - useSearchParams için gerekli
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-purple-50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, CheckCircle } from "lucide-react";

function LoginContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [logoutSuccess, setLogoutSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("logout") === "success") {
            setLogoutSuccess(true);
            const timer = setTimeout(() => {
                setLogoutSuccess(false);
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
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] relative overflow-hidden">
            {/* Liquid Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-[#0071e3]/20 to-[#5ac8fa]/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-[#5856d6]/15 to-[#af52de]/15 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-gradient-to-br from-[#34c759]/10 to-[#5ac8fa]/10 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />
            </div>

            <div className="w-full max-w-md p-8 relative z-10">
                {/* Logo & Title */}
                <div className="text-center mb-8 animate-slide-up">
                    <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#5856d6] items-center justify-center mb-5 shadow-lg">
                        <span className="text-2xl font-bold text-white">PM</span>
                    </div>
                    <h1 className="text-[28px] font-display font-semibold text-[#1d1d1f] mb-1">
                        ParselMonitor
                    </h1>
                    <p className="text-[#6e6e73]">Yönetim paneline giriş yapın</p>
                </div>

                {/* Login Form */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 animate-slide-up stagger-2">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                                E-posta
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] border border-transparent rounded-xl text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 transition-all"
                                    placeholder="admin@parselmonitor.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] border border-transparent rounded-xl text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Success Message */}
                        {logoutSuccess && (
                            <div className="bg-[#34c759]/10 text-[#248a3d] px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Güvenli bir şekilde çıkış yaptınız.
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-[#ff3b30]/10 text-[#d70015] px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0071e3] text-white font-medium py-3.5 px-4 rounded-xl hover:bg-[#0077ed] focus:outline-none focus:ring-4 focus:ring-[#0071e3]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                    </form>

                    {/* Demo Info */}
                    <div className="mt-6 p-4 bg-[#f5f5f7] rounded-xl">
                        <p className="text-xs font-medium text-[#6e6e73] mb-2">Demo Bilgileri:</p>
                        <p className="text-xs text-[#86868b]">admin@parselmonitor.com / admin123</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-[#86868b]">
                    © 2024 ParselMonitor
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
                <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Lock, LogOut, Loader2, FileText, Building, Upload, Save } from "lucide-react";

// Password Change Form Component
function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "Yeni şifre en az 8 karakter olmalıdır" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor" });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: data.message });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.error || "Bir hata oluştu" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Sunucu hatası" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mevcut Şifre
                </label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                />
            </div>

            {/* New Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre
                </label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                />
                {newPassword && (
                    <PasswordStrengthIndicator password={newPassword} />
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre (Tekrar)
                </label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                />
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Güncelleniyor...
                    </>
                ) : (
                    "Şifreyi Güncelle"
                )}
            </button>

            {/* Security Tip */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>💡 Güvenlik İpucu:</strong> Güçlü bir şifre için en az 8 karakter, büyük-küçük harf, rakam ve özel karakter kullanın.
                </p>
            </div>
        </form>
    );
}

// Simple Password Strength Indicator
function PasswordStrengthIndicator({ password }: { password: string }) {
    const getStrength = () => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        return Math.min(score, 4);
    };

    const strength = getStrength();
    const labels = ["", "Çok Zayıf", "Zayıf", "Orta", "Güçlü"];
    const colors = ["bg-gray-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${level <= strength ? colors[strength] : "bg-gray-200"
                            }`}
                    />
                ))}
            </div>
            {strength > 0 && (
                <p className="text-xs font-medium text-gray-600">
                    Şifre Gücü: {labels[strength]}
                </p>
            )}
        </div>
    );
}

// Presentation Settings Form Component
function PresentationSettingsForm() {
    const [settings, setSettings] = useState({
        companyName: "",
        logoUrl: "",
        phone: "",
        email: "",
        address: "",
        website: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    // Ayarları yükle
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/user/presentation-settings");
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        companyName: data.companyName || "",
                        logoUrl: data.logoUrl || "",
                        phone: data.phone || "",
                        email: data.email || "",
                        address: data.address || "",
                        website: data.website || ""
                    });
                }
            } catch (error) {
                console.error("Fetch settings error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            const res = await fetch("/api/user/presentation-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Sunum ayarları başarıyla kaydedildi" });
            } else {
                setMessage({ type: "error", text: "Kayıt sırasında bir hata oluştu" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Sunucu hatası" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Şirket / Kişi Adı
                    </label>
                    <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="INVECO Proje"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                    </label>
                    <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0532 123 45 67"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta
                    </label>
                    <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="info@sirket.com"
                    />
                </div>

                {/* Website */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Web Sitesi
                    </label>
                    <input
                        type="url"
                        value={settings.website}
                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://www.sirket.com"
                    />
                </div>
            </div>

            {/* Address */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres
                </label>
                <textarea
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Merkez Mahallesi, İş Merkezi No:1, İstanbul"
                />
            </div>

            {/* Logo URL */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                </label>
                <input
                    type="url"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">Logo için bir URL girin. Önerilen boyut: 200x80 piksel</p>
                {settings.logoUrl && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Önizleme:</p>
                        <img
                            src={settings.logoUrl}
                            alt="Logo"
                            className="max-h-16 object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {saving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Kaydediliyor...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Kaydet
                    </>
                )}
            </button>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>💡 İpucu:</strong> Bu bilgiler yatırımcı sunumlarının iletişim bölümünde görüntülenecektir.
                </p>
            </div>
        </form>
    );
}

export default function SettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleLogout = async () => {
        setLoading(true);
        try {
            // signOut'u çağır ama redirect'i biz kontrol edelim
            await signOut({ redirect: false });

            // Başarılı çıkış sonrası production login sayfasına yönlendir
            // logout=success parametresi ile kullanıcıya bilgi verilecek
            window.location.href = "https://ekip.invecoproje.com/login?logout=success";
        } catch (error) {
            console.error("Logout error:", error);
            // Hata durumunda da yönlendir
            window.location.href = "https://ekip.invecoproje.com/login";
        }
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
                            value={session?.user?.name || ""}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                        <input
                            type="email"
                            value={session?.user?.email || ""}
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

                <ChangePasswordForm />
            </div>

            {/* Presentation Settings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Sunum Ayarları</h2>
                        <p className="text-sm text-gray-500">Yatırımcı sunumlarında görünecek şirket bilgileri</p>
                    </div>
                </div>

                <PresentationSettingsForm />
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
                    <p className="text-gray-700"><strong>Kullanıcı ID:</strong> {session?.user?.id}</p>
                    <p className="text-gray-700"><strong>Giriş:</strong> {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
            </div>
        </div>
    );
}

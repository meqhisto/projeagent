"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
    LayoutDashboard,
    MapPin,
    Users,
    Building2,
    Trello,
    Map,
    ListChecks,
    Settings,
    LogOut,
    X,
    HardHat
} from "lucide-react";

const allNavigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["USER", "ADMIN"] },
    { name: "Arsalar", href: "/parcels", icon: MapPin, roles: ["USER", "ADMIN"] },
    { name: "Pipeline", href: "/pipeline", icon: Trello, roles: ["USER", "ADMIN"] },
    { name: "Harita", href: "/map", icon: Map, roles: ["USER", "ADMIN"] },
    { name: "Görevler", href: "/tasks", icon: ListChecks, roles: ["USER", "ADMIN"] },
    { name: "Müşteriler", href: "/customers", icon: Users, roles: ["USER", "ADMIN"] },
    { name: "Gayrimenkuller", href: "/properties", icon: Building2, roles: ["USER", "ADMIN"] },
    { name: "Müteahhitler", href: "/contractors", icon: HardHat, roles: ["USER", "ADMIN"] },
    { name: "Ayarlar", href: "/settings", icon: Settings, roles: ["USER", "ADMIN"] },
    { name: "Kullanıcı Yönetimi", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();

    const navigation = allNavigation.filter(item =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item.roles as any[]).includes(session?.user?.role || "USER")
    );

    const handleSignOut = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-black/[0.06] transform transition-transform duration-300 ease-out",
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 h-16 border-b border-black/[0.04]">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#0077ed] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <span className="text-white font-bold text-sm">PM</span>
                            </div>
                            <span className="font-display text-[17px] font-semibold text-[#1d1d1f] tracking-tight">
                                ParselMonitor
                            </span>
                        </Link>

                        <button
                            onClick={onClose}
                            className="lg:hidden p-1.5 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 overflow-y-auto no-scrollbar">
                        <ul className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={clsx(
                                                "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-[#0071e3]/10 text-[#0071e3]"
                                                    : "text-[#1d1d1f] hover:bg-black/[0.04]"
                                            )}
                                        >
                                            <Icon className={clsx(
                                                "h-[18px] w-[18px]",
                                                isActive ? "text-[#0071e3]" : "text-[#86868b]"
                                            )} />
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-black/[0.04] bg-gradient-to-t from-white/50 to-transparent">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/[0.02] transition-colors">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                                {session?.user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-medium text-[#1d1d1f] truncate">
                                    {session?.user?.name || "Kullanıcı"}
                                </div>
                                <div className="text-[11px] text-[#86868b] truncate">
                                    {session?.user?.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition-all"
                                title="Çıkış Yap"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

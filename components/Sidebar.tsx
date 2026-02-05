"use client";

import { Home, Map as MapIcon, Settings, LayoutGrid, KanbanSquare, Users, Shield, Building2, X, LogOut, HardHat, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import clsx from "clsx";

const allNavigation = [
    { name: "Anasayfa", href: "/", icon: Home, roles: ["USER", "ADMIN"] },
    { name: "Parsel Listesi", href: "/parcels", icon: LayoutGrid, roles: ["USER", "ADMIN"] },
    { name: "Gayrimenkul Portföyü", href: "/properties", icon: Building2, roles: ["USER", "ADMIN"] },
    { name: "İş Akışı (Kanban)", href: "/kanban", icon: KanbanSquare, roles: ["USER", "ADMIN"] },
    { name: "Kişiler (Directory)", href: "/customers", icon: Users, roles: ["USER", "ADMIN"] },
    { name: "İnşaat Firmaları", href: "/contractors", icon: HardHat, roles: ["USER", "ADMIN"] },
    { name: "Harita Görünümü", href: "/map", icon: MapIcon, roles: ["USER", "ADMIN"] },
    { name: "Admin Panel", href: "/admin/users", icon: Shield, roles: ["ADMIN"] },
    { name: "Ayarlar", href: "/settings", icon: Settings, roles: ["USER", "ADMIN"] },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Filter navigation based on user role
    const navigation = allNavigation.filter(item =>
        item.roles.includes((session?.user as any)?.role || "USER")
    );

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "flex h-screen flex-col fixed left-0 top-0 z-[9999] transition-all duration-300 ease-out",
                // Premium dark sidebar with gradient
                "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800",
                // Desktop: always visible
                "lg:w-72 lg:translate-x-0",
                // Mobile: slide in/out
                isOpen ? "w-72 translate-x-0 shadow-2xl" : "w-72 -translate-x-full lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="flex h-20 items-center justify-between px-6 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-lg tracking-tight text-white">
                                PARSEL<span className="text-teal-400">MONITOR</span>
                            </span>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Menüyü kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex flex-1 flex-col overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-4 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                        Menü
                    </div>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={clsx(
                                        "group flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all duration-200",
                                        isActive
                                            ? "bg-teal-500/15 text-teal-300"
                                            : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <item.icon
                                            className={clsx(
                                                "mr-3 h-5 w-5 transition-colors",
                                                isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {isActive && (
                                        <ChevronRight className="h-4 w-4 text-teal-400" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile */}
                <UserProfile />
            </div>
        </>
    );
}

function UserProfile() {
    const { data: session } = useSession();

    if (!session || !session.user) return null;

    const initials = session.user.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'US';

    return (
        <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-teal-500/20">
                    {initials}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{session.user.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">
                        {session.user.email}
                    </p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Çıkış Yap"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

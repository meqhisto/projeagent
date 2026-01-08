"use client";

import { Home, Map as MapIcon, Database, Settings, Search, LayoutGrid, KanbanSquare, Users, Shield, Building2, Wallet, X, LogOut, HardHat } from "lucide-react";
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
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "flex h-screen flex-col fixed left-0 top-0 z-[9999] transition-transform duration-300 ease-in-out border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]",
                // Desktop: always visible
                "lg:w-72 lg:translate-x-0",
                // Mobile: slide in/out
                isOpen ? "w-72 translate-x-0 shadow-2xl" : "w-72 -translate-x-full lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="flex h-20 items-center justify-between px-6 border-b border-[var(--sidebar-border)]">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-slate-900">PARSEL<span className="text-emerald-600">MONITOR</span></span>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Menüyü kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex flex-1 flex-col overflow-y-auto py-6 px-4 space-y-1">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menü</div>
                    <nav className="space-y-1.5">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={clsx(
                                        isActive
                                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                        "group flex items-center rounded-lg px-4 py-2.5 text-sm transition-all duration-200"
                                    )}
                                >
                                    <item.icon
                                        className={clsx(
                                            isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600",
                                            "mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
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
        <div className="p-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-emerald-700 ring-2 ring-white shadow-sm">
                    {initials}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{session.user.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">
                        {session.user.email}
                    </p>
                </div>
                <button
                    onClick={() => signOut()}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Çıkış Yap"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

"use client";

import { Home, Map as MapIcon, Database, Settings, Search, LayoutGrid, KanbanSquare, Users, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";

const allNavigation = [
    { name: "Anasayfa", href: "/", icon: Home, roles: ["USER", "ADMIN"] },
    { name: "Parsel Listesi", href: "/parcels", icon: LayoutGrid, roles: ["USER", "ADMIN"] },
    { name: "İş Akışı (Kanban)", href: "/kanban", icon: KanbanSquare, roles: ["USER", "ADMIN"] },
    { name: "Kişiler (Directory)", href: "/customers", icon: Users, roles: ["USER", "ADMIN"] },
    { name: "Harita Görünümü", href: "/map", icon: MapIcon, roles: ["USER", "ADMIN"] },
    { name: "Admin Panel", href: "/admin/users", icon: Shield, roles: ["ADMIN"] },
    { name: "Ayarlar", href: "/settings", icon: Settings, roles: ["USER", "ADMIN"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Filter navigation based on user role
    const navigation = allNavigation.filter(item =>
        item.roles.includes((session?.user as any)?.role || "USER")
    );

    return (
        <div className="flex h-screen w-72 flex-col fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Glass Container */}
            <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl">

                {/* Logo Section */}
                <div className="flex h-20 items-center px-8 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                            <LayoutGrid className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-wide text-white">PARSEL<span className="text-emerald-400 font-light">MONITOR</span></span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Pro v2.0</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-1 flex-col overflow-y-auto py-6 px-4 space-y-1">
                    <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menü</div>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        isActive
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-900/10"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white border-transparent",
                                        "group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent"
                                    )}
                                >
                                    <item.icon
                                        className={clsx(
                                            isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300",
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
        </div>
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
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white ring-2 ring-slate-800">
                    {initials}
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-white">{session.user.name || 'User'}</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Online
                    </p>
                </div>
            </div>
        </div>
    );
}

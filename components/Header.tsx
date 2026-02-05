"use client";

import { useSession } from "next-auth/react";
import { Menu, Search, Bell, ChevronDown } from "lucide-react";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
            <div className="flex items-center justify-between px-4 sm:px-6 h-14">
                {/* Left: Mobile Menu & Search */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Search */}
                    <div className="hidden sm:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
                            <input
                                type="text"
                                placeholder="Ara..."
                                className="w-64 pl-9 pr-4 py-2 bg-[#f5f5f7] border-none rounded-lg text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative p-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff3b30] rounded-full" />
                    </button>

                    {/* User Menu */}
                    <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-black/[0.04] rounded-lg transition-colors">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-medium text-xs">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="hidden sm:block text-sm font-medium text-[#1d1d1f]">
                            {session?.user?.name?.split(" ")[0] || "Kullanıcı"}
                        </span>
                        <ChevronDown className="hidden sm:block h-4 w-4 text-[#6e6e73]" />
                    </button>
                </div>
            </div>
        </header>
    );
}

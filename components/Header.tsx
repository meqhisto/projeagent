"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu, Search, ChevronDown } from "lucide-react";
import SearchModal from "./SearchModal";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { data: session } = useSession();
    const [searchOpen, setSearchOpen] = useState(false);

    // Keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
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

                        {/* Search Trigger */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-3 px-3 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-lg transition-colors group"
                        >
                            <Search className="h-4 w-4 text-[#86868b] group-hover:text-[#6e6e73]" />
                            <span className="hidden sm:block text-sm text-[#86868b] group-hover:text-[#6e6e73]">
                                Ara...
                            </span>
                            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/80 rounded text-[11px] font-medium text-[#86868b] shadow-sm">
                                <span className="text-[10px]">⌘</span>K
                            </kbd>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <NotificationBell />

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

            {/* Search Modal */}
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}

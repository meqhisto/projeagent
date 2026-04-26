"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu, Search } from "lucide-react";
import SearchModal from "./SearchModal";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { data: session } = useSession();
    const [searchOpen, setSearchOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };

        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <>
            <header className={`sticky top-0 z-40 transition-all duration-200 ${
                scrolled
                    ? "bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shadow-sm"
                    : "bg-transparent"
            }`}>
                <div className="flex items-center justify-between px-4 sm:px-6 h-16">
                    {/* Left: Mobile Menu & Search */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Search Trigger - Apple Style */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-3 px-4 py-2 bg-white/60 hover:bg-white border border-black/[0.04] hover:border-black/[0.08] rounded-xl transition-all group shadow-sm w-full sm:w-64"
                        >
                            <Search className="h-4 w-4 text-[#86868b] group-hover:text-[#6e6e73]" />
                            <span className="hidden sm:block text-[13px] font-medium text-[#86868b] group-hover:text-[#6e6e73]">
                                Ara...
                            </span>
                            <div className="hidden sm:flex items-center gap-0.5 ml-auto">
                                <kbd className="px-1.5 py-0.5 bg-black/[0.04] rounded text-[10px] font-medium text-[#86868b]">
                                    ⌘K
                                </kbd>
                            </div>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <NotificationBell />

                        {/* User Menu Trigger (Simplified) */}
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-medium text-xs shadow-sm ring-2 ring-white cursor-default">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Modal */}
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}

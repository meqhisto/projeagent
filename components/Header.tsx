"use client";

import { Menu, Search, Sparkles } from "lucide-react";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 z-40 sticky top-0 glass border-b border-slate-200/60 transition-all">
            {/* Mobile Menu Button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2.5 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-all"
                aria-label="Menüyü aç"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl ml-3 lg:ml-0">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="input-modern block w-full pl-11 pr-16 py-2.5 lg:py-3 text-sm placeholder:text-slate-400"
                        placeholder="Parsel, müşteri veya firma ara..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 hidden md:flex items-center pointer-events-none">
                        <kbd className="inline-flex items-center gap-1 border border-slate-200 rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-50">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3 ml-3">
                {/* Premium Badge - Optional */}
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">Pro</span>
                </div>

                <NotificationBell />
            </div>
        </header>
    );
}

"use client";

import { Menu, Search } from "lucide-react";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 z-40 sticky top-0 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] transition-colors">
            {/* Mobile Menu Button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Menüyü aç"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl ml-2 lg:ml-0">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 lg:py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm text-sm lg:text-base"
                        placeholder="Ara..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 hidden md:flex items-center pointer-events-none">
                        <kbd className="inline-flex items-center border border-gray-200 dark:border-slate-600 rounded px-2 text-xs font-sans font-medium text-gray-400">
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-4 ml-2">
                <NotificationBell />
            </div>
        </header>
    );
}

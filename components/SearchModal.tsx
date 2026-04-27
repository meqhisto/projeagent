"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Users, Loader2, Building2, User } from "lucide-react";
import clsx from "clsx";

interface SearchResult {
    parcels: {
        id: string;
        city: string;
        district: string;
        neighborhood: string;
        island: string;
        parsel: string;
        area: number | null;
        category: string | null;
    }[];
    customers: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        role: string;
    }[];
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult>({ parcels: [], customers: [] });
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery("");
            setResults({ parcels: [], customers: [] });
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard shortcut to open (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                if (!isOpen) {
                    // Parent should handle this
                }
            }
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Search with debounce
    const search = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults({ parcels: [], customers: [] });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                setSelectedIndex(0);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            search(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    const allResults = [
        ...results.parcels.map(p => ({ type: "parcel" as const, data: p })),
        ...results.customers.map(c => ({ type: "customer" as const, data: c })),
    ];

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && allResults[selectedIndex]) {
            e.preventDefault();
            navigateToResult(allResults[selectedIndex]);
        }
    };

    const navigateToResult = (result: typeof allResults[0]) => {
        if (result.type === "parcel") {
            router.push(`/parcels/${result.data.id}`);
        } else {
            router.push(`/customers/${result.data.id}`);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06]">
                    <Search className="h-5 w-5 text-[#86868b] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Parsel veya müşteri ara..."
                        className="flex-1 text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] bg-transparent outline-none"
                    />
                    {loading && <Loader2 className="h-5 w-5 text-[#0071e3] animate-spin" />}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#86868b]">
                        <kbd className="px-1.5 py-0.5 bg-[#f5f5f7] rounded text-[11px] font-medium">ESC</kbd>
                        <span>kapatmak için</span>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {query.length >= 2 && allResults.length === 0 && !loading && (
                        <div className="p-8 text-center text-[#86868b]">
                            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Sonuç bulunamadı</p>
                        </div>
                    )}

                    {query.length < 2 && (
                        <div className="p-8 text-center text-[#86868b]">
                            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Aramak için en az 2 karakter yazın</p>
                        </div>
                    )}

                    {/* Parcels */}
                    {results.parcels.length > 0 && (
                        <div>
                            <div className="px-4 py-2 text-xs font-semibold text-[#86868b] uppercase tracking-wider bg-[#f5f5f7]">
                                Parseller
                            </div>
                            {results.parcels.map((parcel, idx) => (
                                <button
                                    key={parcel.id}
                                    onClick={() => navigateToResult({ type: "parcel", data: parcel })}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                        selectedIndex === idx
                                            ? "bg-[#0071e3] text-white"
                                            : "hover:bg-[#f5f5f7]"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                        selectedIndex === idx ? "bg-white/20" : "bg-[#0071e3]/10"
                                    )}>
                                        <MapPin className={clsx(
                                            "h-4 w-4",
                                            selectedIndex === idx ? "text-white" : "text-[#0071e3]"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={clsx(
                                            "text-sm font-medium truncate",
                                            selectedIndex === idx ? "text-white" : "text-[#1d1d1f]"
                                        )}>
                                            {parcel.city} - {parcel.district}
                                        </p>
                                        <p className={clsx(
                                            "text-xs truncate",
                                            selectedIndex === idx ? "text-white/70" : "text-[#6e6e73]"
                                        )}>
                                            Ada: {parcel.island} / Parsel: {parcel.parsel}
                                            {parcel.area && ` • ${parcel.area.toLocaleString("tr-TR")} m²`}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Customers */}
                    {results.customers.length > 0 && (
                        <div>
                            <div className="px-4 py-2 text-xs font-semibold text-[#86868b] uppercase tracking-wider bg-[#f5f5f7]">
                                Müşteriler
                            </div>
                            {results.customers.map((customer, idx) => {
                                const resultIdx = results.parcels.length + idx;
                                return (
                                    <button
                                        key={customer.id}
                                        onClick={() => navigateToResult({ type: "customer", data: customer })}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                            selectedIndex === resultIdx
                                                ? "bg-[#0071e3] text-white"
                                                : "hover:bg-[#f5f5f7]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                            selectedIndex === resultIdx ? "bg-white/20" : "bg-[#5856d6]/10"
                                        )}>
                                            <User className={clsx(
                                                "h-4 w-4",
                                                selectedIndex === resultIdx ? "text-white" : "text-[#5856d6]"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx(
                                                "text-sm font-medium truncate",
                                                selectedIndex === resultIdx ? "text-white" : "text-[#1d1d1f]"
                                            )}>
                                                {customer.name}
                                            </p>
                                            <p className={clsx(
                                                "text-xs truncate",
                                                selectedIndex === resultIdx ? "text-white/70" : "text-[#6e6e73]"
                                            )}>
                                                {customer.role || customer.email || customer.phone || "-"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-black/[0.06] bg-[#f5f5f7] text-xs text-[#86868b]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm">↓</kbd>
                            gezinmek için
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm">↵</kbd>
                            gitmek için
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

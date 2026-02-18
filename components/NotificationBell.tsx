"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";

const NOTIFICATION_ICONS: Record<string, string> = {
    PARCEL_ADDED: "🆕",
    RESEARCH_COMPLETED: "✅",
    STAGE_CHANGED: "🔄",
    DOCUMENT_UPLOADED: "📄",
    IMAGE_UPLOADED: "📸",
    TASK_DUE: "⏰",
};

function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Az önce";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} gün önce`;
    return new Date(date).toLocaleDateString("tr-TR");
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();

        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=10");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Fetch notifications error:", error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isRead: true }),
            });
            fetchNotifications();
        } catch (error) {
            console.error("Mark as read error:", error);
        }
    };

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            await fetch("/api/notifications/mark-all-read", {
                method: "PATCH",
            });
            fetchNotifications();
        } catch (error) {
            console.error("Mark all as read error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Bildirimler"
                className="relative p-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0071e3]/30"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-[#ff3b30] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/[0.06] z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-black/[0.06]">
                        <h3 className="font-semibold text-[#1d1d1f]">Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="text-xs text-[#0071e3] hover:text-[#0077ed] font-medium flex items-center gap-1"
                            >
                                <CheckCheck className="h-3 w-3" />
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? "bg-blue-50" : ""
                                        }`}
                                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl flex-shrink-0">
                                            {NOTIFICATION_ICONS[notification.type] || "📢"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 text-sm">
                                                {notification.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {timeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Henüz bildirim yok</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

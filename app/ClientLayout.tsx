"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";

interface ClientLayoutProps {
    children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";
    const isTestUiPage = pathname === "/test-ui";
    const isPublicPresentation = pathname?.startsWith("/p/");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    // Public pages without auth
    if (isLoginPage || isTestUiPage || isPublicPresentation) {
        return <AuthProvider>{children}</AuthProvider>;
    }

    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex min-h-screen bg-gradient-subtle relative">
                    {/* Subtle texture overlay */}
                    <div className="texture-noise fixed inset-0 pointer-events-none" />

                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

                    <div className="flex flex-1 flex-col lg:pl-72 pl-0 transition-all duration-300 relative z-10">
                        <Header onMenuClick={toggleSidebar} />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                            <div className="animate-fade-in">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </AuthGuard>
        </AuthProvider>
    );
}

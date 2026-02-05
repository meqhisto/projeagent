"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AuthProvider from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isLoginPage = pathname === "/login";
    const isTestUiPage = pathname === "/test-ui";
    const isPublicPresentation = pathname?.startsWith("/p/");

    useEffect(() => {
        if (status === "unauthenticated" && !isLoginPage && !isTestUiPage && !isPublicPresentation) {
            router.push("/login");
        }
    }, [status, router, isLoginPage, isTestUiPage, isPublicPresentation]);

    if (isLoginPage || isTestUiPage || isPublicPresentation) {
        return <>{children}</>;
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-subtle flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" />
                    <span className="text-sm text-[#6e6e73]">Yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f5f5f7]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:pl-64">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
    );
}

"use client";

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

    return (
        <AuthProvider>
            {isLoginPage ? (
                children
            ) : (
                <AuthGuard>
                    <div className="flex min-h-screen bg-gray-50 text-gray-900">
                        <Sidebar />
                        <div className="flex flex-1 flex-col pl-72">
                            <Header />
                            <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
                                {children}
                            </main>
                        </div>
                    </div>
                </AuthGuard>
            )}
        </AuthProvider>
    );
}

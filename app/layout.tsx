"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body className={`${inter.className} ${isLoginPage ? '' : 'bg-gray-50 text-gray-900'}`}>
        <AuthProvider>
          {isLoginPage ? (
            children
          ) : (
            <AuthGuard>
              <div className="flex min-h-screen">
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
      </body>
    </html>
  );
}

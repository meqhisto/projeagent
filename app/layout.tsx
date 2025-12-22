import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParselMonitor - İnşaat Arsa Yönetim Sistemi",
  description: "Modern, güvenli ve kullanıcı dostu arsa takip ve analiz platformu. Gayrimenkul profesyonelleri için tasarlanmış, tam özellikli CRM ve fizibilite analiz sistemi.",
  keywords: ["arsa", "gayrimenkul", "CRM", "fizibilite", "imar", "parsel"],
  authors: [{ name: "Altan Barış Cömert" }],
  openGraph: {
    title: "ParselMonitor - İnşaat Arsa Yönetim Sistemi",
    description: "Modern arsa takip ve analiz platformu",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}


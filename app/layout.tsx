import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import ClientLayout from "./ClientLayout";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning={true}>
      <body className={`${plusJakarta.variable} ${dmSans.variable} font-body antialiased`}>
        <ClientLayout>
          {children}
          {modal}
        </ClientLayout>
      </body>
    </html>
  );
}

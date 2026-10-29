import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Factures Egalim",
  description: "Gestion de factures et stocks EGALIM pour la restauration collective",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

import Header from './components/Header';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Header />
        <main className="min-h-screen pb-20 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}

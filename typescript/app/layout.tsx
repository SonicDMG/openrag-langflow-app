import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Jacquard_12 } from "next/font/google";
import "./globals.css";
import { DataInitializer } from "./battle-arena/components/creation/DataInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jacquard12 = Jacquard_12({
  variable: "--font-jacquard-12",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Battle Arena - OpenRAG",
  description: "Turn-based battle arena powered by OpenRAG",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-visible">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jacquard12.variable} antialiased overflow-visible`}
        suppressHydrationWarning
      >
        <DataInitializer />
        {children}
      </body>
    </html>
  );
}

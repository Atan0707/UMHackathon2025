import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppKit } from "@/utils/appkit";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import Providers from '@/components/Providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZakatChain",
  description: "ZakatChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 via-white to-emerald-50 min-h-screen`}
      >
        <AppKit>
          <Navbar />
          <Toaster position="top-right" richColors />
          <div className="pt-16 relative z-10">
            <Providers>
              {children}
            </Providers>
          </div>
        </AppKit>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/toast/toast-container";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { BlockLoader } from "@/components/loaders/block-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MovieMoments",
  description: "Share your movie moments with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <ToastProvider>
          <Suspense fallback={<BlockLoader />}>{children}</Suspense>
          <ToastContainer />
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}

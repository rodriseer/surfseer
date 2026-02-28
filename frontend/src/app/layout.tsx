// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import TopNav from "@/components/TopNav";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SurfSeer",
  description: "Ocean City + Assateague surf conditions & forecast.",
  openGraph: {
    title: "SurfSeer",
    description: "Ocean City + Assateague surf conditions & forecast.",
    url: "https://surfcheckseer.com",
    siteName: "SurfSeer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SurfSeer",
    description: "Ocean City + Assateague surf conditions & forecast.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-ocean relative overflow-x-hidden">
        {/* Background FX */}
        <div className="pointer-events-none fixed inset-[-40%] z-0 overflow-visible">
          <div className="surf-shimmer" />
          <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute top-[30%] left-[-120px] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-52 right-[-120px] h-[640px] w-[640px] rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        {/* Main App */}
        <div className="relative z-10">
          <TopNav />
          {children}
        </div>

        <Analytics />
      </body>
    </html>
  );
}
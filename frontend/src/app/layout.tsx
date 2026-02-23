// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

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

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/spot/oc-inlet" className="text-sm font-extrabold tracking-wide text-white/90">
          SurfSeer
        </a>

        <nav className="flex items-center gap-5 text-sm font-semibold text-white/70">
          <a className="hover:text-white transition" href="/gear">
            Gear
          </a>
          <a className="hover:text-white transition" href="/etiquette">
            Etiquette
          </a>
          <a className="hover:text-white transition" href="/about">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-ocean relative overflow-x-hidden">
        {/* Background FX (not clickable, behind content) */}
        <div className="pointer-events-none fixed inset-[-40%] z-0 overflow-visible">
          {/* Moving shimmer */}
          <div className="surf-shimmer" />

          {/* Glow blobs */}
          <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute top-[30%] left-[-120px] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-52 right-[-120px] h-[640px] w-[640px] rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <TopNav />
          {children}
        </div>
      </body>
    </html>
  );
}
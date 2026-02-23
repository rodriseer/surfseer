// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurfSeer",
  description: "Ocean City + Assateague surf conditions & forecast.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white bg-ocean relative overflow-x-hidden">
        {/* Background FX (not clickable, behind content) */}
        <div className="pointer-events-none fixed inset-[-40%] z-0 overflow-visible">
          {/* Moving shimmer */}
          <div className="surf-shimmer" />

          {/* Your glow blobs */}
          <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute top-[30%] left-[-120px] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-52 right-[-120px] h-[640px] w-[640px] rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
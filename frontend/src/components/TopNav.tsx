// src/components/TopNav.tsx (NEW FILE)
"use client";

import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  // Spot pages already have their own sticky header (inside SpotPage).
  // Hiding this prevents "double header" on mobile.
  if (pathname?.startsWith("/spot/")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
        <a href="/spot/oc-inlet" className="text-sm font-extrabold tracking-wide text-white/90">
          SurfSeer
        </a>

        <nav className="hidden sm:flex items-center gap-5 text-sm font-semibold text-white/70">
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
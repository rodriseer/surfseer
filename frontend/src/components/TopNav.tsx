"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/spot/")) return null;

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b backdrop-blur-xl transition",
        scrolled
          ? "border-white/10 bg-black/45 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]"
          : "border-white/10 bg-black/30",
      ].join(" ")}
    >
      <div className="container-app flex items-center justify-between py-4">
        <a href="/" className="flex flex-col gap-0 leading-tight">
          <span className="font-heading text-lg font-semibold tracking-wide text-white">
            SurfSeer
          </span>
          <span className="text-[11px] text-white/60">Surf Intelligence</span>
        </a>

        <a
          href="/spot/oc-inlet"
          className="btn btn-primary px-3 py-2.5 sm:px-4 text-sm font-semibold min-w-[100px] sm:min-w-0"
        >
          Open App
        </a>
      </div>
    </header>
  );
}

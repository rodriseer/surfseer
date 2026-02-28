"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SpotQuickSearch from "@/components/SpotQuickSearch";

type NavItem = { label: string; href: string };

export default function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Spot pages already have their own sticky header (inside SpotPage).
  if (pathname?.startsWith("/spot/")) return null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Gear", href: "/gear" },
      { label: "Etiquette", href: "/etiquette" },
      { label: "About", href: "/about" },
      { label: "Favorites", href: "/favorites" },
    ],
    []
  );

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b backdrop-blur-xl transition",
        scrolled
          ? "border-white/10 bg-black/45 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]"
          : "border-white/10 bg-black/30",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo + Brand */}
        <a href="/spot/oc-inlet" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-cyan-400/15 blur-xl opacity-0 group-hover:opacity-100 transition" />
            <div className="relative rounded-xl border border-white/10 bg-white/10 p-1.5">
              <Image
                src="/logo.png"
                alt="SurfSeer logo"
                width={28}
                height={28}
                className="rounded-lg"
                priority
              />
            </div>
          </div>

          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
              SurfSeer
            </div>
            <div className="text-[11px] text-white/55 -mt-0.5">East Coast surf forecasting</div>
          </div>
        </a>

        {/* Desktop: search + nav + CTA */}
        <div className="hidden sm:flex items-center gap-6">
          {/* Quick spot switcher */}
          <SpotQuickSearch />

          {/* “Today’s pick” badge (honest + clickable) */}
          <a
            href="/spot/oc-inlet"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            title="Quick jump"
          >
            Today’s pick: OC Inlet
          </a>

          <nav className="flex items-center gap-6 text-sm text-white/70">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={[
                    "group relative transition hover:text-white",
                    active ? "text-white" : "",
                  ].join(" ")}
                >
                  {item.label}
                  <span
                    className={[
                      "absolute left-0 -bottom-2 h-[2px] w-full rounded-full bg-gradient-to-r from-cyan-300/0 via-cyan-300/80 to-cyan-300/0 transition-all",
                      active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-75 group-hover:opacity-100 group-hover:scale-x-100",
                    ].join(" ")}
                  />
                </a>
              );
            })}
          </nav>

          <a
            href="/spot/oc-inlet"
            className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20 transition"
          >
            Open Forecast
          </a>
        </div>

        {/* Mobile: keep it simple (dock handles nav) */}
        <div className="sm:hidden">
          <a
            href="/spot/oc-inlet"
            className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20 transition"
          >
            Forecast
          </a>
        </div>
      </div>
    </header>
  );
}
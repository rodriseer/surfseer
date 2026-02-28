"use client";

import { usePathname } from "next/navigation";

function DockLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={[
        "flex-1 rounded-2xl px-3 py-2 text-center text-xs font-semibold transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </a>
  );
}

export default function MobileDock() {
  const pathname = usePathname() || "";

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // For spot routes, keep Forecast highlighted
  const forecastActive = pathname.startsWith("/spot/");

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 sm:hidden px-4">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-black/45 backdrop-blur-xl p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.85)]">
        <div className="flex gap-2">
          <DockLink href="/spot/oc-inlet" label="Forecast" active={forecastActive} />
          <DockLink href="/favorites" label="Favorites" active={active("/favorites")} />
          <DockLink href="/gear" label="Gear" active={active("/gear")} />
          <DockLink href="/etiquette" label="Etiquette" active={active("/etiquette")} />
        </div>
      </div>
    </div>
  );
}
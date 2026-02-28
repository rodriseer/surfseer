"use client";

import { usePathname } from "next/navigation";

const items = [
  { href: "/spot/oc-inlet", label: "Forecast" },
  { href: "/favorites", label: "Favorites" },
  { href: "/gear", label: "Gear" },
  { href: "/etiquette", label: "Etiquette" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Only show on mobile-ish pages (you can tweak this)
  // If you want it everywhere, delete this block.
  const show = true;
  if (!show) return null;

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-50
        px-4
        pb-[calc(env(safe-area-inset-bottom)+12px)]
        pt-3
      "
    >
      <div
        className="
          mx-auto max-w-6xl
          rounded-3xl
          border border-white/10
          bg-black/40 backdrop-blur-xl
          shadow-[0_10px_35px_rgba(0,0,0,0.45)]
        "
      >
        <div className="grid grid-cols-4 gap-1 p-2">
          {items.map((it) => {
            const active =
              pathname === it.href || (it.href.startsWith("/spot") && pathname?.startsWith("/spot"));
            return (
              <a
                key={it.href}
                href={it.href}
                className={`
                  rounded-2xl px-3 py-3 text-center text-xs font-semibold transition
                  ${active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}
                `}
              >
                {it.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
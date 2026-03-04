"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SPOTS, type SpotId } from "@/lib/spots";

type Spot = { id: SpotId; name: string };

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const spots = useMemo(() => Object.values(SPOTS) as Spot[], []);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return spots.slice(0, 8);
    return spots
      .filter((sp) => sp.name.toLowerCase().includes(s) || String(sp.id).toLowerCase().includes(s))
      .slice(0, 10);
  }, [q, spots]);

  const go = (id: SpotId) => {
    setOpen(false);
    setQ("");
    router.push(`/spot/${id}`);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Enter surf spot or beach"
        className="
          w-full rounded-2xl border border-white/20 bg-white/10
          px-4 py-3.5 text-base text-white placeholder:text-white/50
          outline-none focus:border-cyan-300/40 focus:bg-white/15
          transition-colors
        "
        aria-label="Search surf spot or beach"
      />

      {open && (
        <div className="absolute left-0 right-0 mt-2 z-20 overflow-hidden rounded-2xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-xl">
          <div className="max-h-[280px] overflow-auto">
            {filtered.length ? (
              filtered.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(sp.id)}
                  className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition"
                >
                  {sp.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-white/60">No matches.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

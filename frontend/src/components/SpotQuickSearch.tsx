"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SPOTS, type SpotId } from "@/lib/spots";

type Spot = { id: SpotId; name: string };

export default function SpotQuickSearch() {
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
    <div className="relative">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // let clicks register
            setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Search spots…"
          className="
            w-[220px]
            rounded-xl
            border border-white/10
            bg-white/5
            px-3 py-2
            text-sm text-white/90
            placeholder:text-white/40
            outline-none
            focus:border-cyan-300/30
            focus:bg-white/10
          "
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-white/40">
          /
        </div>
      </div>

      {open ? (
        <div className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
          <div className="px-3 py-2 text-xs font-semibold text-white/60 border-b border-white/10">
            Jump to a spot
          </div>

          <div className="max-h-[320px] overflow-auto">
            {filtered.length ? (
              filtered.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(sp.id)}
                  className="w-full text-left px-3 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                >
                  <div className="font-semibold">{sp.name}</div>
                  <div className="text-xs text-white/45">/spot/{sp.id}</div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-white/60">No matches.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
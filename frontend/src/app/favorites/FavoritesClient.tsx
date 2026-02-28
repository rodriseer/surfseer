"use client";

import { useEffect, useMemo, useState } from "react";
import { SPOTS, type SpotId } from "@/lib/spots";
import { FAVORITE_SPOT_STORAGE_KEY } from "@/components/FavoriteButton";

type Spot = { id: SpotId; name: string };

function readPinnedFavorite(): string | null {
  try {
    return localStorage.getItem(FAVORITE_SPOT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function FavoritesClient() {
  const [favId, setFavId] = useState<string | null>(null);

  const spots = useMemo(() => Object.values(SPOTS) as Spot[], []);
  const byId = useMemo(() => {
    const m = new Map<string, Spot>();
    for (const s of spots) m.set(String(s.id), s);
    return m;
  }, [spots]);

  useEffect(() => {
    setFavId(readPinnedFavorite());
  }, []);

  const favSpot = favId ? byId.get(favId) : null;

  return (
    <div>
      {!favSpot ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/75">
            No favorite spot yet. Open a forecast spot and hit <span className="font-semibold">Save</span>.
          </p>
          <a
            href="/spot/oc-inlet"
            className="mt-4 inline-block rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 transition"
          >
            Open forecast
          </a>
        </div>
      ) : (
        <a
          href={`/spot/${favSpot.id}`}
          className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
        >
          <p className="text-xs font-semibold text-white/60">Pinned favorite</p>
          <div className="mt-2 text-xl font-extrabold text-white">{favSpot.name}</div>
          <div className="mt-1 text-xs text-white/55">/spot/{favSpot.id}</div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85">
            Open forecast →
          </div>
        </a>
      )}
    </div>
  );
}
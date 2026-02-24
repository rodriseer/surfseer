// src/components/FavoriteButton.tsx (NEW FILE)
"use client";

import { useEffect, useMemo, useState } from "react";

const KEY = "surfseer:favSpotId";

function getFav(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function setFav(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}

function clearFav() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export default function FavoriteButton({ spotId }: { spotId: string }) {
  const [fav, setFavState] = useState<string | null>(null);

  useEffect(() => {
    setFavState(getFav());
  }, []);

  const isFav = useMemo(() => fav === spotId, [fav, spotId]);

  function toggle() {
    if (isFav) {
      clearFav();
      setFavState(null);
    } else {
      setFav(spotId);
      setFavState(spotId);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`uplift inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition
        ${
          isFav
            ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
        }`}
      aria-label={isFav ? "Remove favorite spot" : "Save as favorite spot"}
      title={isFav ? "Favorite spot" : "Set as favorite"}
    >
      <span aria-hidden="true">{isFav ? "★" : "☆"}</span>
      <span>{isFav ? "Favorite" : "Save"}</span>
    </button>
  );
}

export { KEY as FAVORITE_SPOT_STORAGE_KEY };
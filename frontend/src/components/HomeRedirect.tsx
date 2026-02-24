// src/components/HomeRedirect.tsx (NEW FILE)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FAVORITE_SPOT_STORAGE_KEY } from "@/components/FavoriteButton";

export default function HomeRedirect({ fallbackSpotId }: { fallbackSpotId: string }) {
  const router = useRouter();

  useEffect(() => {
    try {
      const fav = localStorage.getItem(FAVORITE_SPOT_STORAGE_KEY);
      if (fav && typeof fav === "string" && fav.trim().length > 0) {
        router.replace(`/spot/${encodeURIComponent(fav)}`);
      } else {
        router.replace(`/spot/${fallbackSpotId}`);
      }
    } catch {
      router.replace(`/spot/${fallbackSpotId}`);
    }
  }, [router, fallbackSpotId]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center text-white/80">
      Redirecting…
    </div>
  );
}
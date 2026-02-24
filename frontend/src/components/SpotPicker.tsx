// src/components/SpotPicker.tsx (UPDATED)
"use client";

import { usePathname, useRouter } from "next/navigation";
import { SPOTS, type SpotId } from "@/lib/spots";

function getSpotFromPath(pathname: string): SpotId {
  // expected: /spot/<spotId>
  const parts = pathname.split("/").filter(Boolean);
  const maybe = parts[1]; // ["spot", "<id>"]
  if (parts[0] === "spot" && maybe && Object.prototype.hasOwnProperty.call(SPOTS, maybe)) {
    return maybe as SpotId;
  }
  // fallback to first
  return Object.keys(SPOTS)[0] as SpotId;
}

export default function SpotPicker() {
  const router = useRouter();
  const pathname = usePathname();

  const current = getSpotFromPath(pathname);

  return (
    <div className="flex items-center gap-2 w-full">
      <label htmlFor="spot" className="text-xs font-semibold text-white/60 shrink-0">
        Spot
      </label>

      <div className="relative w-full">
        <select
          id="spot"
          value={current}
          onChange={(e) => router.push(`/spot/${e.target.value}`)}
          className="w-full appearance-none glass soft-shadow rounded-2xl border border-cyan-200/15
                     bg-cyan-500/10 px-4 py-3 pr-10 text-base sm:text-sm font-semibold text-white
                     outline-none focus:ring-2 focus:ring-cyan-300/30"
        >
          {Object.values(SPOTS).map((s) => (
            <option key={s.id} value={s.id} className="bg-[#061a26] text-white">
              {s.name}
            </option>
          ))}
        </select>

        {/* custom chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-cyan-100/80">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
"use client";

import { usePathname, useRouter } from "next/navigation";

const SPOTS = [
  { id: "oc-inlet", name: "Ocean City (Inlet)" },
  { id: "oc-north", name: "Ocean City (Northside)" },
  { id: "assateague", name: "Assateague" },
] as const;

type SpotId = (typeof SPOTS)[number]["id"];

function getSpotFromPath(pathname: string): SpotId {
  const parts = pathname.split("/").filter(Boolean);
  const spotId = parts[0] === "spot" ? parts[1] : null;

  if (spotId && SPOTS.some((s) => s.id === spotId)) return spotId as SpotId;
  return "oc-inlet";
}

export default function SpotPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const current = getSpotFromPath(pathname);

  function setSpot(id: SpotId) {
    router.push(`/spot/${id}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-white/70">Spot</span>
      <select
        value={current}
        onChange={(e) => setSpot(e.target.value as SpotId)}
        className="uplift rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
      >
        {SPOTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
import type { Metadata } from "next";
import { SPOTS } from "@/lib/spots";

export async function generateMetadata({
  params,
}: {
  params: { spotId: string } | Promise<{ spotId: string }>;
}): Promise<Metadata> {
  const p = await params;
  const id = decodeURIComponent(p?.spotId || "").toLowerCase().trim();

  const spot = (id in SPOTS) ? SPOTS[id as keyof typeof SPOTS] : null;

  if (!spot) {
    return { title: "Spot not found | SurfSeer" };
  }

  return {
    title: `${spot.name} | SurfSeer`,
    description: `Live surf conditions and forecast for ${spot.name}.`,
  };
}

export default function SpotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
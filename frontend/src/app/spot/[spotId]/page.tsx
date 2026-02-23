import SpotPage from "@/app/_shared/SpotPage";
import { SPOTS, type SpotId } from "@/lib/spots";
import { notFound } from "next/navigation";

export default async function SpotPageRoute({
  params,
}: {
  params: { spotId: string } | Promise<{ spotId: string }>;
}) {
  const p = await params;
  const id = decodeURIComponent(p?.spotId || "").toLowerCase().trim();

  if (!(id in SPOTS)) notFound();
  return <SpotPage spotId={id as SpotId} />;
}
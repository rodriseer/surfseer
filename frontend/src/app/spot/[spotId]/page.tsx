export const dynamic = "force-dynamic";
export const revalidate = 0;

import SpotPage, { type SpotId } from "@/app/_shared/SpotPage";

const VALID: SpotId[] = ["oc-inlet", "oc-north", "assateague"];

export default async function Page({
  params,
}: {
  // Next 16: params can be a Promise
  params: Promise<Record<string, string>>;
}) {
  const p = await params;

  // If your folder is [spotId], this will exist:
  const raw = p.spotId ?? p.id ?? Object.values(p)[0] ?? "oc-inlet";

  const spotId = (VALID.includes(raw as SpotId) ? (raw as SpotId) : "oc-inlet") satisfies SpotId;

  return <SpotPage key={spotId} spotId={spotId} />;
}
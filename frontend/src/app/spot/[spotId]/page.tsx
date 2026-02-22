import SpotPage from "@/app/_shared/SpotPage";

export default async function Page({
  params,
}: {
  params: Promise<{ spotId: string }>;
}) {
  const p = await params;
  return <SpotPage spotId={p.spotId} />;
}
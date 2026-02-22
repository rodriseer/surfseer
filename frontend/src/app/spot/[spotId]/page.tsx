import SpotPage, { type SpotId } from "@/app/_shared/SpotPage";

export default async function Page({
  params,
}: {
  params: Promise<{ spotId: SpotId }>;
}) {
  const { spotId } = await params;
  return <SpotPage spotId={spotId} />;
}
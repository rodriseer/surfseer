import SpotPage from "@/app/_shared/SpotPage";

export default function Page({
  params,
}: {
  params: { spotId: string };
}) {
  return <SpotPage spotId={params.spotId} />;
}
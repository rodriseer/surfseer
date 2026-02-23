import { ImageResponse } from "next/og";
import { SPOTS } from "@/lib/spots";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: { spotId: string } | Promise<{ spotId: string }>;
}) {
  const p = await params;
  const id = decodeURIComponent(p?.spotId || "").toLowerCase().trim();

  const spot = (id in SPOTS) ? SPOTS[id as keyof typeof SPOTS] : null;
  const spotName = spot?.name ?? "Surf Spot";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#ffffff",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800 }}>SurfSeer</div>
        <div style={{ marginTop: 18, fontSize: 46, fontWeight: 750 }}>
          {spotName}
        </div>
        <div style={{ marginTop: 18, fontSize: 28, opacity: 0.72 }}>
          Forecast • Swell • Wind • Tide
        </div>
      </div>
    ),
    size
  );
}
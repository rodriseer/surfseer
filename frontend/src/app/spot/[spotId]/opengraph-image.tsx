// app/spot/[spotId]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { SPOTS } from "@/lib/spots";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { spotId: string } }
) {
  const id = decodeURIComponent(params.spotId || "").toLowerCase().trim();
  const spot = (SPOTS as any)[id];

  const title = spot?.name ?? "SurfSeer";
  const url = new URL(req.url);
  const host = `${url.protocol}//${url.host}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #04121c 0%, #0a1f2e 45%, #06293d 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 12 }}>SurfSeer</div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 28, opacity: 0.8, marginTop: 18 }}>
          Daily surf conditions • Best window • Tide + wind
        </div>
        <div style={{ fontSize: 22, opacity: 0.7, marginTop: 26 }}>
          {host}/spot/{id}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
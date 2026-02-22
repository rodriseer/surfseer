import { ImageResponse } from "next/og";
import { SPOTS } from "@/app/_shared/SpotPage";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { spotId: string };
}) {
  const spot = SPOTS.find((s) => s.id === params.spotId) ?? SPOTS[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          padding: "60px",
          background: "white",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
          position: "relative",
        }}
      >
        {/* soft top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "320px",
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(56,189,248,0.22), rgba(255,255,255,0) 70%)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 18, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#0ea5e9",
              }}
            />
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>SurfSeer</div>
          </div>

          <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {spot.name}
          </div>

          <div style={{ fontSize: 24, color: "#52525b", maxWidth: 900, lineHeight: 1.35 }}>
            Clean surf summary + “Best Window” so you know if it’s worth paddling out.
          </div>

          <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
            <Badge>Live wind</Badge>
            <Badge>Buoy swell</Badge>
            <Badge>Tide timing</Badge>
            <Badge>Best Window</Badge>
          </div>

          <div style={{ marginTop: 42, fontSize: 18, color: "#71717a" }}>
            surfseer • ocean city md
          </div>
        </div>
      </div>
    ),
    size
  );
}

function Badge({ children }: { children: string }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid rgba(228,228,231,1)",
        background: "rgba(255,255,255,0.9)",
        fontSize: 18,
        fontWeight: 700,
        color: "#18181b",
      }}
    >
      {children}
    </div>
  );
}
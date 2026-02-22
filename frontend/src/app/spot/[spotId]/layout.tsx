import type { Metadata } from "next";
import { SPOTS } from "@/app/_shared/SpotPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ spotId: string }>;
}): Promise<Metadata> {
  const { spotId } = await params;
  const spot = SPOTS.find((s) => s.id === spotId) ?? SPOTS[0];

  const title = `SurfSeer — ${spot.name}`;
  const description = `Live surf conditions + Best Window for ${spot.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `/spot/${spot.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/spot/${spot.id}`,
      images: [{ url: `/spot/${spot.id}/opengraph-image` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/spot/${spot.id}/opengraph-image`],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
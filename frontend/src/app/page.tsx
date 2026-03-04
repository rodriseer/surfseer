// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import HeroSearch from "@/components/HeroSearch";

const surfImages = [
  "/silas-hero.jpg",
  "/lifestyle.jpg",
  "/background.jpg",
];

export default function HomePage() {
  const [bg, setBg] = useState<string | null>(null);

  useEffect(() => {
    const choice = surfImages[Math.floor(Math.random() * surfImages.length)];
    if (typeof window === "undefined") {
      setBg(choice);
      return;
    }
    const img = new window.Image();
    img.src = choice;
    img.onload = () => setBg(choice);
    img.onerror = () => setBg(surfImages[0]);
  }, []);

  const heroStyle = bg ? { backgroundImage: `url(${bg})` } : undefined;

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Hero: rotating surf background, headline, subtext, input, button */}
      <section
        className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 bg-center bg-no-repeat bg-cover bg-fixed"
        style={heroStyle}
      >
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-black/80" />
        <div className="grain-overlay z-[10]" />

        <div className="relative z-20 w-full max-w-2xl mx-auto flex flex-col items-center gap-6 sm:gap-8">
          <h1 className="font-heading heading-hero text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-wide">
            Find the best surf conditions.
          </h1>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
            SurfScore analyzes wave height, swell period, wind, and tides.
          </p>

          <div className="w-full flex flex-col gap-4">
            <HeroSearch />
            <a
              href="/spot/oc-inlet"
              className="btn btn-primary w-full sm:w-auto min-w-[180px] px-5 py-3.5 text-base font-semibold"
            >
              Get SurfScore
            </a>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container-app flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm muted">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-semibold text-white tracking-wide">
              SurfSeer
            </span>
            <span>A Seer Labs Product</span>
          </div>
          <a
            href="https://theseerlabs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="surf-link"
          >
            theseerlabs.com
          </a>
        </div>
      </footer>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-4 sm:left-auto sm:right-5 sm:translate-x-0 z-10 text-[10px] sm:text-xs text-white/60 text-center sm:text-right">
        Photo by{" "}
        <a
          href="https://unsplash.com/@silasbaisch"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-white"
        >
          Silas Baisch
        </a>{" "}
        on{" "}
        <a
          href="https://unsplash.com"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-white"
        >
          Unsplash
        </a>
      </div>
    </main>
  );
}

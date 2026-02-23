"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/spot/oc-inlet");
  }, [router]);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="glass soft-shadow rounded-3xl p-8 fade-in">
          <h1 className="text-3xl font-extrabold tracking-tight">SurfSeer</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Redirecting you to today’s spot report…
          </p>
        </div>
      </div>
    </main>
  );
}
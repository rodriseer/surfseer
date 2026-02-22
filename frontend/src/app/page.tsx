"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { message: string } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

type SurfReport = {
  spot?: { name?: string };
  updatedAtISO?: string;
  now?: {
    waveHeightFt?: number | null;
    wavePeriodS?: number | null;
    windMph?: number | null;
    score10?: number | null;
  };
};

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SurfReport | null>(null);

  useEffect(() => {
    // If your real homepage is /spot/[spotId], send users there.
    router.replace("/spot/oc-inlet");
  }, [router]);

  // Optional: keep a tiny API smoke-test here (won’t crash the UI)
  useEffect(() => {
    let cancelled = false;

    async function smokeTest() {
      try {
        setError(null);
        setLoading(true);

        const res = await fetch("/api/forecast?spot=assateague", { cache: "no-store" });
        const json = (await res.json()) as ApiResponse<SurfReport>;

        if (!res.ok || json.ok === false) {
          const msg =
            (json as any)?.error?.message ??
            (json as any)?.message ??
            "Failed to load";
          if (!cancelled) setError(String(msg));
          return;
        }

        if (!cancelled) setReport(json.data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    smokeTest();
    return () => {
      cancelled = true;
    };
  }, []);

  // This page will usually redirect instantly; these renders are just a fallback
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-extrabold tracking-tight">SurfSeer</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Redirecting you to today’s spot report…
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          {loading ? (
            <p className="text-sm text-zinc-600">Loading…</p>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <div className="text-sm text-zinc-700">
              <div className="font-semibold">API smoke-test OK ✅</div>
              <div className="mt-2 text-zinc-600">
                Spot: {report?.spot?.name ?? "—"}
              </div>
            </div>
          )}

          <button
            className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
            onClick={() => router.push("/spot/oc-inlet")}
            type="button"
          >
            Go to Ocean City report
          </button>
        </div>
      </div>
    </main>
  );
}
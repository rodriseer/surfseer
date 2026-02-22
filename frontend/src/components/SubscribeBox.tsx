"use client";

import { useState } from "react";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { message: string } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

export default function SubscribeBox({ spotId }: { spotId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, spotId }),
      });

      const json = (await res.json()) as ApiResponse<{ email: string; spotId: string }>;

      if (!res.ok || json.ok === false) {
        setStatus("err");
        setMsg((json as any)?.error?.message ?? "Something went wrong.");
        return;
      }

      setStatus("ok");
      setMsg("You’re in ✅ We’ll send the daily report soon.");
      setEmail("");
    } catch (e) {
      setStatus("err");
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-extrabold">Get the daily surf report</p>
      <p className="mt-1 text-sm text-zinc-600">
        Ocean City + Assateague. One email per day. No spam.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join"}
        </button>
      </form>

      {status !== "idle" && (
        <div
          className={
            "mt-3 rounded-xl border p-3 text-sm " +
            (status === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : status === "err"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-zinc-200 bg-zinc-50 text-zinc-700")
          }
        >
          {msg}
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-500">
        By joining, you agree to receive SurfSeer emails. Unsubscribe anytime.
      </p>
    </div>
  );
}
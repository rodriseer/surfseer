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

  const statusStyles =
    status === "ok"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : status === "err"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
        : "border-white/10 bg-white/5 text-white/70";

  return (
    <div className="glass soft-shadow rounded-3xl p-5">
      <p className="text-sm font-extrabold text-white">Get the daily surf report</p>
      <p className="mt-1 text-sm text-white/70">
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
          className="uplift w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="uplift rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white glass hover:bg-white/14 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join"}
        </button>
      </form>

      {status !== "idle" && (
        <div className={`mt-3 rounded-2xl border p-3 text-sm ${statusStyles}`}>{msg}</div>
      )}

      <p className="mt-3 text-xs text-white/55">
        By joining, you agree to receive SurfSeer emails. Unsubscribe anytime.
      </p>
    </div>
  );
}
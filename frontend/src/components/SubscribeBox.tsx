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
      setMsg("Subscribed. You’ll get the daily report.");
      setEmail("");
    } catch (e) {
      setStatus("err");
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const statusStyles =
    status === "ok"
      ? "border-white/12 bg-white/6 text-white/80"
      : status === "err"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
        : "border-white/10 bg-white/5 text-white/70";

  return (
    <div className="glass soft-shadow rounded-3xl p-5">
      <p className="text-sm font-semibold text-white">Daily surf report</p>
      <p className="mt-1 text-sm text-white/60">
        One email per day. Ocean City + Assateague.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          className="uplift w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="uplift rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white glass hover:bg-white/14 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join"}
        </button>
      </form>

      {status !== "idle" && (
        <div className={`mt-3 rounded-2xl border p-3 text-sm ${statusStyles}`}>
          {msg}
        </div>
      )}

      <p className="mt-3 text-xs text-white/45">Unsubscribe anytime.</p>
    </div>
  );
}
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
        setMsg(json.ok === false ? json.error.message : "Something went wrong.");
        return;
      }

      setStatus("ok");
      setMsg("You’re in. We’ll email you when it’s worth paddling out.");
      setEmail("");
    } catch {
      setStatus("err");
      setMsg("Network error. Try again.");
    }
  }

  return (
    <section className="card-lite p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold">Get alerts for this spot</p>
          <p className="mt-1 text-sm muted leading-6">
            Simple emails when conditions are good. No spam.
          </p>
        </div>
        <div className="text-xs text-white/60">
          {status === "loading" ? "Sending…" : status === "ok" ? "Subscribed" : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/45
                     focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
        />
        <button
          type="submit"
          disabled={status === "loading" || email.trim().length < 5}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Notify me
        </button>
      </form>

      {msg ? (
        <p className={`mt-3 text-sm ${status === "err" ? "text-rose-200" : "text-emerald-100"}`}>
          {msg}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-white/60">
        Tip: this becomes a monetization engine later (local surf shops, gear, reports).
      </p>
    </section>
  );
}
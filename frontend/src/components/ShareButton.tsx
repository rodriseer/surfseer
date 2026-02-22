"use client";

import { useState } from "react";

export default function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback if clipboard blocked
      window.prompt("Copy this link:", window.location.href);
    }
  }

  return (
    <button
      onClick={copy}
      className={
        className ??
        "rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold hover:bg-zinc-50"
      }
    >
      {copied ? "Copied ✅" : "Share report"}
    </button>
  );
}
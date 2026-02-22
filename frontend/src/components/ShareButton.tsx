"use client";

import { useState } from "react";

export default function ShareButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;

    try {
      // Modern clipboard API (works on HTTPS, user gesture)
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for stricter browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={copy} className={className}>
      {copied ? "Copied ✅" : "Share report"}
    </button>
  );
}
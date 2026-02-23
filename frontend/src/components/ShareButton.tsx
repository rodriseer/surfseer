"use client";

import { useMemo, useState } from "react";

export default function ShareButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const base =
    "uplift rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white glass hover:bg-white/10";

  const classes = useMemo(() => {
    return className.trim().length ? className : base;
  }, [className]);

  async function copyOrShare() {
    const url = window.location.href;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({
          title: "SurfSeer report",
          text: "Check these surf conditions:",
          url,
        });
        return;
      } catch {
        // fall through
      }
    }

    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // fall through
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";

      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);

      const ok = document.execCommand("copy");
      document.body.removeChild(ta);

      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // fall through
    }

    window.prompt("Copy this link:", url);
  }

  return (
    <button onClick={copyOrShare} className={classes} type="button">
      {copied ? "Copied" : "Share"}
    </button>
  );
}
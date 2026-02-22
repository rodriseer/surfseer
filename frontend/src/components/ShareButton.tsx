"use client";

import { useState } from "react";

export default function ShareButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyOrShare() {
    const url = window.location.href;

    // 1) Prefer native share sheet on supported devices (mobile)
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as any).share({
          title: "SurfSeer report",
          text: "Check these surf conditions:",
          url,
        });
        return;
      } catch {
        // user cancelled or share failed -> continue to copy fallback
      }
    }

    // 2) Clipboard API (best on HTTPS + supported browsers)
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // continue to legacy fallback
    }

    // 3) Legacy fallback (works in more places, incl. some iOS cases)
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
      ta.setSelectionRange(0, ta.value.length); // important for iOS

      const ok = document.execCommand("copy");
      document.body.removeChild(ta);

      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // continue to last resort
    }

    // 4) Last resort: show a prompt so the user can manually copy
    window.prompt("Copy this link:", url);
  }

  return (
    <button onClick={copyOrShare} className={className} type="button">
      {copied ? "Copied ✅" : "Share report"}
    </button>
  );
}
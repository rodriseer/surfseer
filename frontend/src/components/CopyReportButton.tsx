"use client";

import { useMemo, useState } from "react";

export default function CopyReportButton({
  spotName,
  url,
  score,
  bestWindowLabel,
  status,
}: {
  spotName: string;
  url: string;
  score: number | null;
  bestWindowLabel: string | null;
  status: string;
}) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const s = score != null ? `${score.toFixed(1)}/10` : "—/10";
    const st = status ? ` ${status}.` : "";
    const bw = bestWindowLabel ? ` Best window: ${bestWindowLabel}.` : "";
    return `${spotName}: ${s}.${st}${bw}\n${url}`;
  }, [spotName, url, score, bestWindowLabel, status]);

  async function onCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // last-resort fallback
      window.prompt("Copy this report:", text);
    }
  }

  return (
    <button
      onClick={onCopy}
      className="uplift rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white glass hover:bg-white/10"
      type="button"
    >
      {copied ? "Copied ✅" : "Copy report"}
    </button>
  );
}
"use client";

import { useLayoutEffect, useRef } from "react";

const MD_BREAKPOINT = 768;

type Props = {
  title: string;
  children: React.ReactNode;
  /** Optional: id for anchor links */
  id?: string;
  /** Summary line when closed (mobile) */
  summaryHint?: string;
};

export default function CollapsibleSection({ title, children, id, summaryHint = "Tap to expand" }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const el = detailsRef.current;
    if (!el) return;

    const syncForDesktop = () => {
      // Only force open on desktop; on mobile leave open/closed to the user (don't force close on resize)
      if (window.innerWidth >= MD_BREAKPOINT) {
        el.open = true;
      }
    };

    syncForDesktop();
    window.addEventListener("resize", syncForDesktop);
    return () => window.removeEventListener("resize", syncForDesktop);
  }, []);

  return (
    <details
      ref={detailsRef}
      id={id}
      className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden mt-4 first:mt-0 md:border-0 md:bg-transparent [&>summary]:list-none"
    >
      <summary className="cursor-pointer select-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white/90 md:py-2 md:px-0 md:cursor-default md:pointer-events-none">
        <span>{title}</span>
        <span className="text-xs font-normal text-white/50 md:hidden">{summaryHint}</span>
      </summary>
      <div className="px-4 pb-4 pt-0 md:pt-4 md:px-0 md:pb-0">{children}</div>
    </details>
  );
}

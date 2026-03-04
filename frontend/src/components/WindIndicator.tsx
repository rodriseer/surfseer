"use client";

/**
 * Small arrow indicating wind direction (wind comes FROM this direction).
 * Subtle sway animation so the UI feels alive.
 */
export default function WindIndicator({ deg }: { deg: number | null }) {
  if (deg == null || !Number.isFinite(deg)) return null;

  // Arrow points toward where wind is coming from (meteorological convention)
  const rotate = deg;

  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 text-white/70"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="w-4 h-4 animate-wind-sway"
      >
        <path d="M12 2v8M12 2L9 5M12 2l3 5" />
      </svg>
    </span>
  );
}

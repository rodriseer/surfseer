// src/lib/surfScore.ts

// absolute angular difference in degrees (0..180)
function angleDiff(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function degToCompass(deg: number) {
  if (!Number.isFinite(deg)) return "—";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const i = Math.round(((deg % 360) / 45)) % 8;
  return dirs[i];
}

// windDirDeg = direction the wind comes FROM
// Offshore means wind comes from land (opposite of where the beach faces)
export function windQuality(windDirDeg: number, beachFacingDeg: number) {
  const offshoreFrom = (beachFacingDeg + 180) % 360;
  const diff = angleDiff(windDirDeg, offshoreFrom);

  if (diff <= 35) return { label: "Offshore", bonus: 2 };
  if (diff <= 70) return { label: "Side-off", bonus: 1 };
  if (diff <= 110) return { label: "Cross", bonus: 0 };
  if (diff <= 145) return { label: "Side-on", bonus: -1 };
  return { label: "Onshore", bonus: -2 };
}

export function scoreSurf10({
  windMph,
  waveFt,
  periodS,
  windDirBonus = 0,
}: {
  windMph: number | null;
  waveFt: number | null;
  periodS: number | null;
  windDirBonus?: number;
}) {
  let score = 5;

  const hasAny = windMph != null || waveFt != null || periodS != null;
  if (!hasAny) {
    return {
      score10: null as number | null,
      status: "—",
      take: "Loading conditions…",
    };
  }

  // waves
  if (waveFt != null) {
    if (waveFt < 1) score -= 2;
    else if (waveFt < 2) score += 0;
    else if (waveFt < 4) score += 2;
    else score += 1;
  }

  // period
  if (periodS != null) {
    if (periodS < 6) score -= 1;
    else if (periodS < 9) score += 0;
    else if (periodS < 12) score += 1;
    else score += 2;
  }

  // wind speed
  if (windMph != null) {
    if (windMph <= 5) score += 2;
    else if (windMph <= 10) score += 1;
    else if (windMph <= 15) score -= 1;
    else score -= 3;
  }

  // wind direction
  score += windDirBonus;

  score = Math.max(1, Math.min(10, score));

  let status = "Rideable";
  if (score >= 8) status = "Clean";
  else if (score >= 6) status = "Rideable";
  else if (score >= 4) status = "Meh";
  else status = "Poor";

  const parts: string[] = [];
  if (waveFt != null && periodS != null) {
    parts.push(`${waveFt.toFixed(1)} ft @ ${Math.round(periodS)}s`);
  } else if (waveFt != null) {
    parts.push(`${waveFt.toFixed(1)} ft`);
  }
  if (windMph != null) parts.push(`${Math.round(windMph)} mph wind`);

  const take = parts.length ? `Current: ${parts.join(" • ")}.` : "Current conditions loaded.";

  return { score10: score, status, take };
}

export function bestWindow2h({
  hourly,
  waveFt,
  periodS,
  beachFacingDeg,
}: {
  hourly: Array<{ time: string; windMph: number | null; windDirDeg: number | null }>;
  waveFt: number | null;
  periodS: number | null;
  beachFacingDeg: number;
}) {
  if (!Array.isArray(hourly) || hourly.length < 2) return null;

  const swellBonus =
    waveFt != null && periodS != null
      ? waveFt >= 2 && periodS >= 8
        ? 0.4
        : waveFt >= 1.5 && periodS >= 7
          ? 0.2
          : 0
      : 0;

  let best: { i: number; score: number; windLabel: string } | null = null;

  for (let i = 0; i < hourly.length - 1; i++) {
    const a = hourly[i]?.windMph;
    const b = hourly[i + 1]?.windMph;
    if (a == null || b == null) continue;

    const avg = (a + b) / 2;

    let s = 10 - avg * 0.6;
    s = Math.max(0, Math.min(10, s));

    // swell nudge
    s += swellBonus;

    // direction nudge (prefer offshore/side-off)
    const wd = hourly[i]?.windDirDeg;
    let windLabel = "—";
    if (wd != null && Number.isFinite(wd)) {
      const wq = windQuality(wd, beachFacingDeg);
      windLabel = wq.label;
      s += wq.bonus * 0.2;
    }

    if (!best || s > best.score) best = { i, score: s, windLabel };
  }

  if (!best) return null;

  return {
    start: hourly[best.i].time,
    end: hourly[best.i + 1].time,
    windLabel: best.windLabel,
  };
}
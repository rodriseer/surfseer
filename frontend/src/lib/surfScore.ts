// src/lib/surfScore.ts
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

/**
 * More realistic scoring:
 * - Wave has a sweet spot (2–6ft), too small/too big penalized
 * - Period has a sweet spot (10–14s), short period penalized
 * - Wind speed penalty scales with wind direction quality
 */
export function scoreSurf10({
  windMph,
  waveFt,
  periodS,
  windDirBonus = 0, // -2..+2 from windQuality
}: {
  windMph: number | null;
  waveFt: number | null;
  periodS: number | null;
  windDirBonus?: number;
}) {
  const hasAny = windMph != null || waveFt != null || periodS != null;
  if (!hasAny) {
    return {
      score10: null as number | null,
      status: "—",
      take: "Loading conditions…",
      breakdown: null as
        | null
        | {
            base: number;
            wave: number;
            period: number;
            windSpeed: number;
            windDir: number;
            totalBeforeClamp: number;
            totalClamped: number;
          },
    };
  }

  const base = 5;
  let score = base;

  let waveAdj = 0;
  let periodAdj = 0;
  let windSpeedAdj = 0;
  const windDirAdj = windDirBonus;

  // ---- Wave height (sweet spot) ----
  if (waveFt != null) {
    if (waveFt < 0.5) waveAdj = -3;
    else if (waveFt < 1.0) waveAdj = -2;
    else if (waveFt < 2.0) waveAdj = -0.5;
    else if (waveFt < 4.0) waveAdj = 2.0;
    else if (waveFt < 6.0) waveAdj = 1.5;
    else if (waveFt < 8.0) waveAdj = 0.0;
    else waveAdj = -1.0;

    score += waveAdj;
  }

  // ---- Period (sweet spot) ----
  if (periodS != null) {
    if (periodS < 6) periodAdj = -2.0;
    else if (periodS < 8) periodAdj = -0.5;
    else if (periodS < 10) periodAdj = 0.5;
    else if (periodS < 13) periodAdj = 2.0;
    else if (periodS < 16) periodAdj = 1.0;
    else periodAdj = 0.5;

    score += periodAdj;
  }

  // ---- Wind speed (direction-aware) ----
  if (windMph != null) {
    if (windMph <= 5) windSpeedAdj = 1.5;
    else if (windMph <= 10) windSpeedAdj = 0.8;
    else if (windMph <= 15) windSpeedAdj = -0.2;
    else if (windMph <= 20) windSpeedAdj = -1.2;
    else if (windMph <= 25) windSpeedAdj = -2.2;
    else windSpeedAdj = -3.2;

    // Make bad direction punish more, good direction punish less
    // windDirBonus: +2 offshore ... -2 onshore
    const dirFactor = 1 + (-windDirBonus * 0.18); // onshore increases penalty, offshore reduces
    windSpeedAdj *= dirFactor;

    // Extra penalty for strong onshore/side-on
    if (windDirBonus <= -1 && windMph > 12) windSpeedAdj -= 0.8;

    // Small reward for light offshore/side-off
    if (windDirBonus >= 1 && windMph <= 12) windSpeedAdj += 0.4;

    score += windSpeedAdj;
  }

  // ---- Wind direction bonus ----
  score += windDirAdj * 0.8;

  const totalBeforeClamp = score;
  const totalClamped = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  let status = "Rideable";
  if (totalClamped >= 8) status = "Clean";
  else if (totalClamped >= 6) status = "Good";
  else if (totalClamped >= 4) status = "Fair";
  else status = "Poor";

  const parts: string[] = [];
  if (waveFt != null && periodS != null) parts.push(`${waveFt.toFixed(1)} ft @ ${Math.round(periodS)}s`);
  else if (waveFt != null) parts.push(`${waveFt.toFixed(1)} ft`);
  if (windMph != null) parts.push(`${Math.round(windMph)} mph wind`);

  const take = parts.length ? `Current: ${parts.join(" • ")}.` : "Current conditions loaded.";

  return {
    score10: totalClamped,
    status,
    take,
    breakdown: {
      base,
      wave: waveAdj,
      period: periodAdj,
      windSpeed: windSpeedAdj,
      windDir: windDirAdj * 0.8,
      totalBeforeClamp,
      totalClamped,
    },
  };
}

/**
 * Picks best 2-hour window based on surf score (not just lowest wind).
 */
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

  let best: { i: number; avg: number; windLabel: string } | null = null;

  for (let i = 0; i < hourly.length - 1; i++) {
    const a = hourly[i];
    const b = hourly[i + 1];

    const aBonus =
      a.windDirDeg != null && Number.isFinite(a.windDirDeg)
        ? windQuality(a.windDirDeg, beachFacingDeg).bonus
        : 0;

    const bBonus =
      b.windDirDeg != null && Number.isFinite(b.windDirDeg)
        ? windQuality(b.windDirDeg, beachFacingDeg).bonus
        : 0;

    const sA = scoreSurf10({ windMph: a.windMph, waveFt, periodS, windDirBonus: aBonus }).score10;
    const sB = scoreSurf10({ windMph: b.windMph, waveFt, periodS, windDirBonus: bBonus }).score10;

    if (typeof sA !== "number" || typeof sB !== "number") continue;

    const avg = (sA + sB) / 2;

    let windLabel = "—";
    if (a.windDirDeg != null && Number.isFinite(a.windDirDeg)) {
      windLabel = windQuality(a.windDirDeg, beachFacingDeg).label;
    }

    if (!best || avg > best.avg) best = { i, avg, windLabel };
  }

  if (!best) return null;

  return {
    start: hourly[best.i].time,
    end: hourly[best.i + 1].time,
    windLabel: best.windLabel,
  };
}
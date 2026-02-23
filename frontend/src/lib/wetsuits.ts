// src/lib/wetsuits.ts
import type { SpotId } from "@/lib/spots";

export type WetsuitSeason = "winter" | "spring" | "summer" | "fall";

export type WetsuitRec = {
  title: string;
  details: string;
};

type WetsuitBySeason = Record<WetsuitSeason, WetsuitRec[]>;

const DEFAULTS: Record<"midatlantic" | "northeast" | "southeast" | "florida", WetsuitBySeason> = {
  midatlantic: {
    winter: [
      { title: "5/4 Hooded Fullsuit", details: "5–7mm boots + 5mm gloves on cold days" },
      { title: "6/5/4 (if you run cold)", details: "Especially for dawn patrol & windy days" },
    ],
    spring: [
      { title: "4/3 Fullsuit", details: "Boots optional early spring" },
      { title: "3/2 Fullsuit", details: "Late spring warm-up weeks" },
    ],
    summer: [
      { title: "Boardshorts / Bikini", details: "Or 2mm top on windy mornings" },
      { title: "2mm Springsuit / Shorty", details: "If you get cold easily" },
    ],
    fall: [
      { title: "3/2 Fullsuit", details: "Prime season—comfortable and flexible" },
      { title: "4/3 Fullsuit", details: "Late fall, especially with north winds" },
    ],
  },
  northeast: {
    winter: [
      { title: "6/5 Hooded Fullsuit", details: "7mm boots + 5–7mm gloves" },
      { title: "5/4 Hooded (milder winter)", details: "Only on warmer spells" },
    ],
    spring: [
      { title: "5/4 Fullsuit", details: "Early spring is still winter-cold" },
      { title: "4/3 Fullsuit", details: "Late spring" },
    ],
    summer: [
      { title: "2mm Shorty / 2mm Top", details: "Warmest months" },
      { title: "3/2 Fullsuit", details: "Cooler nights / windy days" },
    ],
    fall: [
      { title: "4/3 Fullsuit", details: "Most consistent" },
      { title: "3/2 Fullsuit", details: "Early fall warm weeks" },
    ],
  },
  southeast: {
    winter: [
      { title: "4/3 Fullsuit", details: "Often enough for most winter days" },
      { title: "5/4 Hooded (cold snaps)", details: "If water/air drops hard" },
    ],
    spring: [
      { title: "3/2 Fullsuit", details: "Early spring" },
      { title: "2mm Shorty", details: "Late spring" },
    ],
    summer: [
      { title: "Boardshorts", details: "Maybe a rashguard" },
      { title: "2mm Top (windy mornings)", details: "Optional comfort layer" },
    ],
    fall: [
      { title: "2mm Shorty", details: "Early fall" },
      { title: "3/2 Fullsuit", details: "Late fall" },
    ],
  },
  florida: {
    winter: [
      { title: "3/2 Fullsuit", details: "Most days" },
      { title: "2mm Shorty", details: "Warmer winter afternoons" },
    ],
    spring: [
      { title: "2mm Shorty", details: "Comfortable most spring days" },
      { title: "Rashguard", details: "Late spring warm-up" },
    ],
    summer: [
      { title: "Rashguard / Boardshorts", details: "Hydration + sun protection" },
      { title: "No wetsuit", details: "Most of the time" },
    ],
    fall: [
      { title: "Rashguard", details: "Early fall" },
      { title: "2mm Shorty", details: "Late fall cool-down" },
    ],
  },
};

function regionForSpot(spotId: SpotId) {
  if (spotId === "montauk") return "northeast";
  if (spotId === "outer-banks" || spotId === "wrightsville-beach" || spotId === "virginia-beach")
    return "southeast";
  if (spotId === "cocoa-beach" || spotId === "sebastian-inlet") return "florida";
  return "midatlantic";
}

export function getWetsuitRecs(spotId: SpotId): WetsuitBySeason {
  return DEFAULTS[regionForSpot(spotId)];
}

export function seasonForNow(d = new Date()): WetsuitSeason {
  const m = d.getMonth(); // 0-11
  if (m === 11 || m === 0 || m === 1) return "winter";
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 8) return "summer";
  return "fall";
}

export function seasonLabel(s: WetsuitSeason) {
  if (s === "winter") return "Winter";
  if (s === "spring") return "Spring";
  if (s === "summer") return "Summer";
  return "Fall";
}
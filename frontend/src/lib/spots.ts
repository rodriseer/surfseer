// src/lib/spots.ts

export const SPOTS = {
  "oc-inlet": {
    id: "oc-inlet",
    name: "Ocean City (Inlet)",
    lat: 38.3287,
    lon: -75.0913,
    beachFacingDeg: 90,
    notes: {
      waveType: "Inlet / jetty + sandbar",
      bestSwell: "NE–E",
      bestWind: "W–NW (offshore/side-off)",
      bestTide: "Mid to high (varies by sandbar)",
      hazards: ["Strong current near inlet", "Crowd in summer", "Jetty rocks"],
      crowd: "High in season",
    },
  },
  "oc-north": {
    id: "oc-north",
    name: "Ocean City (Northside)",
    lat: 38.4066,
    lon: -75.057,
    beachFacingDeg: 85,
    notes: {
      waveType: "Beach break",
      bestSwell: "E–SE (depends on bars)",
      bestWind: "W–NW",
      bestTide: "Mid tide often cleaner",
      hazards: ["Closeouts on steep swell", "Rip currents"],
      crowd: "Medium–High",
    },
  },
  assateague: {
    id: "assateague",
    name: "Assateague",
    lat: 38.0534,
    lon: -75.2443,
    beachFacingDeg: 110,
    notes: {
      waveType: "Wild beach break",
      bestSwell: "E–SE",
      bestWind: "W–NW",
      bestTide: "Mid tide",
      hazards: ["Rips", "Long walks", "Shifting sandbars"],
      crowd: "Low–Medium",
    },
  },
  oceancity: {
    id: "oceancity",
    name: "Ocean City, MD",
    lat: 38.3365,
    lon: -75.0849,
    beachFacingDeg: 90,
  },

  "indian-river-inlet": {
    id: "indian-river-inlet",
    name: "Indian River Inlet, DE",
    lat: 38.6143,
    lon: -75.0674,
    beachFacingDeg: 90,
  },
  "virginia-beach": {
    id: "virginia-beach",
    name: "Virginia Beach, VA",
    lat: 36.8529,
    lon: -75.978,
    beachFacingDeg: 80,
  },
  "cape-may": {
    id: "cape-may",
    name: "Cape May, NJ",
    lat: 38.9351,
    lon: -74.906,
    beachFacingDeg: 110,
  },
  "outer-banks": {
    id: "outer-banks",
    name: "Outer Banks, NC",
    lat: 35.5585,
    lon: -75.4665,
    beachFacingDeg: 90,
  },
  "wrightsville-beach": {
    id: "wrightsville-beach",
    name: "Wrightsville Beach, NC",
    lat: 34.2135,
    lon: -77.786,
    beachFacingDeg: 120,
  },
  montauk: {
    id: "montauk",
    name: "Montauk, NY",
    lat: 41.0359,
    lon: -71.9545,
    beachFacingDeg: 165,
  },
  "cocoa-beach": {
    id: "cocoa-beach",
    name: "Cocoa Beach, FL",
    lat: 28.32,
    lon: -80.6076,
    beachFacingDeg: 90,
  },
  "sebastian-inlet": {
    id: "sebastian-inlet",
    name: "Sebastian Inlet, FL",
    lat: 27.8606,
    lon: -80.4473,
    beachFacingDeg: 90,
  },
} as const;

export type SpotId = keyof typeof SPOTS;

export function isSpotId(x: string): x is SpotId {
  return Object.prototype.hasOwnProperty.call(SPOTS, x);
}

export function getSpotOrNull(spotId: string) {
  return isSpotId(spotId) ? SPOTS[spotId] : null;
}
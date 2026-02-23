// src/lib/spots.ts

export const SPOTS = {
  "oc-inlet": {
    id: "oc-inlet",
    name: "Ocean City (Inlet)",
    lat: 38.3287,
    lon: -75.0913,
    beachFacingDeg: 90,
  },
  "oc-north": {
    id: "oc-north",
    name: "Ocean City (Northside)",
    lat: 38.4066,
    lon: -75.057,
    beachFacingDeg: 85,
  },
  assateague: {
    id: "assateague",
    name: "Assateague",
    lat: 38.0534,
    lon: -75.2443,
    beachFacingDeg: 110,
  },
  oceancity: {
    id: "oceancity",
    name: "Ocean City, MD",
    lat: 38.3365,
    lon: -75.0849,
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
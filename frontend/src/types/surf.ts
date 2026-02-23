import type { SpotId } from "@/lib/spots";

// Keep this synced automatically with SPOTS keys
export type SpotKey = SpotId;

export type SurfHour = {
  timeISO: string;

  waveHeightFt: number | null;
  wavePeriodS: number | null;
  waveDirDeg: number | null;

  windMph: number | null;
  windDirDeg: number | null;

  waterTempF: number | null;

  score10: number | null;
};

export type SurfNow = {
  waveHeightFt: number | null;
  wavePeriodS: number | null;
  waveDirDeg: number | null;

  windMph: number | null;
  windDirDeg: number | null;

  tideFt: number | null;
  waterTempF: number | null;

  score10: number | null;
};

export type SurfReport = {
  spot: {
    key: SpotKey;
    name: string;
    lat: number;
    lng: number;
  };
  updatedAtISO: string;
  now: SurfNow;
  hours: SurfHour[];
};

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { message: string } };

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function isApiOk<T>(res: ApiResponse<T>): res is ApiOk<T> {
  return res.ok === true;
}
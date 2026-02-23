import { NextResponse } from "next/server";

type ApiMeta = {
  cached?: boolean;
  cacheLayer?: "memory" | "db" | "fresh";
};

export type ApiOk<T> = { ok: true; data: T } & ApiMeta;

export type ApiErr = { ok: false; error: { message: string } };

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, meta?: ApiMeta) {
  return NextResponse.json({
    ok: true as const,
    ...meta,
    data,
  });
}

export function fail(message: string, status = 500) {
  return NextResponse.json({ ok: false as const, error: { message } }, { status });
}
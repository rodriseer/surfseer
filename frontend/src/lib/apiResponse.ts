export type ApiOk<T> = { ok: true; data: T; cached?: boolean };
export type ApiErr = { ok: false; error: { message: string } };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T, opts?: { cached?: boolean }) {
  return Response.json({ ok: true as const, data, ...(opts ?? {}) });
}

export function fail(message: string, status = 500) {
  return Response.json({ ok: false as const, error: { message } }, { status });
}
// src/lib/singleFlight.ts

type AsyncFn<T> = () => Promise<T>;

const inflight = new Map<string, Promise<any>>();

export async function singleFlight<T>(key: string, fn: AsyncFn<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      return await fn();
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}
type Entry<T> = { ts: number; value: T };

export class TTLCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private ttlMs: number) {}

  get(key: string): { hit: true; value: T } | { hit: false } {
    const e = this.map.get(key);
    if (!e) return { hit: false };

    const fresh = Date.now() - e.ts < this.ttlMs;
    if (!fresh) {
      this.map.delete(key);
      return { hit: false };
    }
    return { hit: true, value: e.value };
  }

  set(key: string, value: T) {
    this.map.set(key, { ts: Date.now(), value });
  }

  clear(key?: string) {
    if (key) this.map.delete(key);
    else this.map.clear();
  }
}
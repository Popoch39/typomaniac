type Window = { count: number; nextReset: Date };

// Per-key request counters over fixed time windows, in memory. Windows are immutable:
// each increment returns its own snapshot, so concurrent requests never read each
// other's counts (elysia-rate-limit v4 got this wrong: every concurrent request
// near the limit was rejected).
export class FixedWindowStore {
  readonly #windows = new Map<string, Window>();
  readonly #windowMs: number;
  readonly #maxKeys: number;

  constructor({ windowMs, maxKeys = 10_000 }: { windowMs: number; maxKeys?: number }) {
    this.#windowMs = windowMs;
    this.#maxKeys = maxKeys;
  }

  increment(key: string, now = Date.now()): Window {
    const current = this.#windows.get(key);

    const window =
      current !== undefined && current.nextReset.getTime() > now
        ? { ...current, count: current.count + 1 }
        : { count: 1, nextReset: new Date(now + this.#windowMs) };

    this.#touch(key, window);

    return window;
  }

  // Map keeps insertion order: re-inserting on each hit makes the first key the least
  // recently seen, evicted first so memory stays bounded under many distinct clients.
  #touch(key: string, window: Window) {
    this.#windows.delete(key);
    this.#windows.set(key, window);

    for (const oldest of this.#windows.keys()) {
      if (this.#windows.size <= this.#maxKeys) {
        break;
      }

      this.#windows.delete(oldest);
    }
  }
}

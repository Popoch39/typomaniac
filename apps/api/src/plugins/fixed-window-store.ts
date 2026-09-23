import type { Context } from "elysia-rate-limit";

type Window = { count: number; start: number; nextReset: Date };

// Replaces elysia-rate-limit's DefaultContext, which hands back its mutable counter:
// the plugin reads it after an `await`, so concurrent requests all saw the final count
// and every one of them got a 429. Windows here are immutable, each increment returns
// its own snapshot.
export class FixedWindowStore implements Context {
  readonly #windows = new Map<string, Window>();
  readonly #windowMs: number;
  readonly #maxKeys: number;

  constructor({ windowMs, maxKeys = 10_000 }: { windowMs: number; maxKeys?: number }) {
    this.#windowMs = windowMs;
    this.#maxKeys = maxKeys;
  }

  init() {}

  increment(key: string, duration = this.#windowMs, now = Date.now()) {
    const current = this.#windows.get(key);

    const window =
      current !== undefined && current.nextReset.getTime() > now
        ? { ...current, count: current.count + 1 }
        : { count: 1, start: now, nextReset: new Date(now + duration) };

    this.#touch(key, window);

    return window;
  }

  decrement(key: string) {
    const current = this.#windows.get(key);

    if (current !== undefined) {
      this.#windows.set(key, { ...current, count: Math.max(current.count - 1, 0) });
    }
  }

  reset(key?: string) {
    if (key === undefined) {
      this.#windows.clear();
    } else {
      this.#windows.delete(key);
    }
  }

  kill() {
    this.#windows.clear();
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

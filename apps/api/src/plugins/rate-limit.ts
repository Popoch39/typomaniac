import { type Context, Elysia } from "elysia";

import { API_PREFIX } from "../api-prefix";
import { ApiError } from "../errors";
import { clientIp } from "./client-ip";
import { FixedWindowStore } from "./fixed-window-store";

export type RateLimit = { max: number; windowMs: number };

export type RateLimitConfig = RateLimit & {
  // Read X-Forwarded-For for the client IP (see clientIp).
  trustProxy: boolean;
};

const UNLIMITED_PATHS = new Set([`${API_PREFIX}/health`]);

// Counts a request of `key` against at most `max` per window, in memory: the `RateLimit-*`
// headers tell where it stands. Over the limit it throws, so the 429 goes through the error
// handler like any other error.
export const keyedRateLimit = ({ max, windowMs }: RateLimit) => {
  const store = new FixedWindowStore({ windowMs });

  return (key: string, set: Context["set"]) => {
    const window = store.increment(key);
    const resetSeconds = Math.max(0, Math.ceil((window.nextReset.getTime() - Date.now()) / 1000));

    set.headers["ratelimit-limit"] = String(max);
    set.headers["ratelimit-remaining"] = String(Math.max(max - window.count, 0));
    set.headers["ratelimit-reset"] = String(resetSeconds);

    if (window.count > max) {
      set.headers["retry-after"] = String(resetSeconds);

      throw new ApiError("TOO_MANY_REQUESTS");
    }
  };
};

// Counts every request (404s included, so route scanning is limited too) in onRequest,
// before routing, per client IP. Counters live in memory, per process: to revisit if the API
// is scaled out.
export const rateLimit = ({ max, windowMs, trustProxy }: RateLimitConfig) => {
  const count = keyedRateLimit({ max, windowMs });

  return new Elysia({ name: "rate-limit", seed: count })
    .onRequest(({ request, server, set }) => {
      if (UNLIMITED_PATHS.has(new URL(request.url).pathname)) {
        return;
      }

      // Without a server (app.handle in tests), every request shares one bucket.
      count(clientIp(request, server, trustProxy), set);
    })
    .as("global");
};

import { Elysia } from "elysia";

import { API_PREFIX } from "../api-prefix";
import { ApiError } from "../errors";
import { clientIp } from "./client-ip";
import { FixedWindowStore } from "./fixed-window-store";

export type RateLimitConfig = {
  max: number;
  windowMs: number;
  // Read X-Forwarded-For for the client IP (see clientIp).
  trustProxy: boolean;
};

const UNLIMITED_PATHS = new Set([`${API_PREFIX}/health`]);

// Counts every request (404s included, so route scanning is limited too) in onRequest,
// before routing. Over the limit it throws, so the 429 goes through the error handler
// like any other error. Counters live in memory, per process: to revisit if the API
// is scaled out.
export const rateLimit = ({ max, windowMs, trustProxy }: RateLimitConfig) => {
  const store = new FixedWindowStore({ windowMs });

  return new Elysia({ name: "rate-limit", seed: store })
    .onRequest(({ request, server, set }) => {
      if (UNLIMITED_PATHS.has(new URL(request.url).pathname)) {
        return;
      }

      // Without a server (app.handle in tests), every request shares one bucket.
      const window = store.increment(clientIp(request, server, trustProxy));
      const resetSeconds = Math.max(0, Math.ceil((window.nextReset.getTime() - Date.now()) / 1000));

      set.headers["ratelimit-limit"] = String(max);
      set.headers["ratelimit-remaining"] = String(Math.max(max - window.count, 0));
      set.headers["ratelimit-reset"] = String(resetSeconds);

      if (window.count > max) {
        set.headers["retry-after"] = String(resetSeconds);

        throw new ApiError("TOO_MANY_REQUESTS");
      }
    })
    .as("global");
};

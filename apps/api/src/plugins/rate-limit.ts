import { Elysia } from "elysia";

import { ApiError } from "../errors";
import { FixedWindowStore } from "./fixed-window-store";

export type RateLimitConfig = {
  max: number;
  windowMs: number;
  // Behind a reverse proxy every request comes from the proxy's address: the client IP
  // must be read from X-Forwarded-For. Never trust it otherwise, anyone can forge it.
  trustProxy: boolean;
};

const UNLIMITED_PATHS = new Set(["/health"]);

const clientKey = (
  request: Request,
  server: { requestIP: (request: Request) => { address: string } | null } | null,
  trustProxy: boolean,
) => {
  const forwardedFor = trustProxy
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined;

  // server is null outside a real server (app.handle in tests): one shared bucket.
  return forwardedFor || (server?.requestIP(request)?.address ?? "");
};

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

      const window = store.increment(clientKey(request, server, trustProxy));
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

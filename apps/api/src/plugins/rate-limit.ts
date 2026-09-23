import { type Generator, rateLimit as elysiaRateLimit } from "elysia-rate-limit";

import { FixedWindowStore } from "./fixed-window-store";

export type RateLimitConfig = {
  max: number;
  windowMs: number;
  // Behind a reverse proxy every request comes from the proxy's address: the client IP
  // must be read from X-Forwarded-For. Never trust it otherwise, anyone can forge it.
  trustProxy: boolean;
};

const UNLIMITED_PATHS = new Set(["/health"]);

const clientKey =
  (trustProxy: boolean): Generator =>
  (request, server) => {
    if (trustProxy) {
      const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

      if (forwardedFor) {
        return forwardedFor;
      }
    }

    // null outside a real server (app.handle in tests): every request shares one bucket.
    return server?.requestIP(request)?.address ?? "";
  };

// In-memory store: counters are per process, to revisit if the API is scaled out.
export const rateLimit = ({ max, windowMs, trustProxy }: RateLimitConfig) =>
  elysiaRateLimit({
    max,
    duration: windowMs,
    generator: clientKey(trustProxy),
    skip: (request) => UNLIMITED_PATHS.has(new URL(request.url).pathname),
    errorResponse: Response.json({ error: "Too Many Requests" }, { status: 429 }),
    context: new FixedWindowStore({ windowMs }),
  });

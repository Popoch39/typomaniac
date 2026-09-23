import { Elysia } from "elysia";

// Helmet-like headers for a JSON-only API: nothing here is meant to be rendered or framed.
const BASE_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "cross-origin-resource-policy": "same-site",
  "cross-origin-opener-policy": "same-origin",
} as const;

const HSTS = "max-age=31536000; includeSubDomains";

// Set in onRequest so that error responses (404, 400, 500…) carry them too.
export const securityHeaders = ({ isProduction }: { isProduction: boolean }) =>
  new Elysia({ name: "security-headers", seed: isProduction })
    .onRequest(({ set }) => {
      Object.assign(set.headers, BASE_HEADERS);

      if (isProduction) {
        set.headers["strict-transport-security"] = HSTS;
      }
    })
    .as("global");

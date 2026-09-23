import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { API_PREFIX } from "../api-prefix";

// Routes as registered: createApp's prefix is added in front of them.
const DOCS_ROUTE = "/openapi";

const SPEC_ROUTE = `${DOCS_ROUTE}/json`;

export const DOCS_PATH = `${API_PREFIX}${DOCS_ROUTE}`;

export const SPEC_PATH = `${API_PREFIX}${SPEC_ROUTE}`;

// Pinned so the bundle loaded from the CDN only changes when we bump it.
const SCALAR_VERSION = "1.71.0";

// The API's CSP (`default-src 'none'`) blocks the Scalar page: this one lets it load its
// bundle from jsdelivr, inject its styles and fetch the spec from this origin.
const DOCS_CSP = [
  "default-src 'none'",
  "script-src https://cdn.jsdelivr.net",
  "style-src 'unsafe-inline'",
  "font-src https://fonts.scalar.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join("; ");

// OpenAPI spec at /api/openapi/json, Scalar reference at /api/openapi. Off in production: the
// docs describe every route, nobody outside the team needs them.
export const apiDocs = ({ enabled }: { enabled: boolean }) =>
  new Elysia({ name: "api-docs", seed: enabled })
    .onRequest(({ request, set }) => {
      if (enabled && new URL(request.url).pathname === DOCS_PATH) {
        set.headers["content-security-policy"] = DOCS_CSP;
      }
    })
    .as("global")
    .use(
      openapi({
        enabled,
        path: DOCS_ROUTE,
        specPath: SPEC_ROUTE,
        scalar: { version: SCALAR_VERSION },
        documentation: {
          info: {
            title: "Typomaniac API",
            version: "1.0.0",
            description:
              "Every error response has the ApiErrorBody layout: `{ error: { code, message, requestId, details? } }`.",
          },
          tags: [
            { name: "System", description: "Service health" },
            { name: "Auth", description: "The signed-in User and their Session" },
          ],
        },
      }),
    );

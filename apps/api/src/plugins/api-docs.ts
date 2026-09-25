import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { API_PREFIX } from "../lib/api-prefix";
import { AUTH_PATH, type AuthHandler } from "../modules/auth";

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

type AuthSchema = Awaited<ReturnType<AuthHandler["api"]["generateOpenAPISchema"]>>;

type AuthPath = AuthSchema["paths"][string];

// The part of the generated spec the merge touches.
type Spec = {
  paths: Record<string, AuthPath>;
  components: { schemas?: AuthSchema["components"]["schemas"] };
};

// Better Auth describes its endpoints relative to its basePath, under its own tags.
const authReference = async (auth: AuthHandler) => {
  const { paths, components } = await auth.api.generateOpenAPISchema();

  const tagged = Object.entries(paths).map(([path, operations]): [string, AuthPath] => [
    `${AUTH_PATH}${path}`,
    Object.fromEntries(
      Object.entries(operations).map(([method, operation]) => [
        method,
        { ...operation, tags: ["Auth"] },
      ]),
    ),
  ]);

  return { paths: Object.fromEntries(tagged), components };
};

type ApiDocsOptions = { enabled: boolean; auth: AuthHandler };

// OpenAPI spec at /api/openapi/json, Scalar reference at /api/openapi. Off in production: the
// docs describe every route, nobody outside the team needs them. Better Auth's endpoints
// (hidden from the route list) are merged into the spec from its openAPI plugin.
export const apiDocs = ({ enabled, auth }: ApiDocsOptions) => {
  // Built on the first spec request, once: the endpoints do not change at runtime.
  let reference: ReturnType<typeof authReference> | undefined;

  return (
    new Elysia({ name: "api-docs", seed: enabled })
      .onRequest(({ request, set }) => {
        if (enabled && new URL(request.url).pathname === DOCS_PATH) {
          set.headers["content-security-policy"] = DOCS_CSP;
        }
      })
      .as("global")
      // Local to the docs routes: as a global hook, its return type would widen every
      // route's response type in Eden.
      .onAfterHandle(async ({ request, responseValue }) => {
        if (!enabled || new URL(request.url).pathname !== SPEC_PATH) {
          return;
        }

        reference ??= authReference(auth);

        const { paths, components } = await reference;

        // SAFETY: on SPEC_PATH, the handler is the openapi plugin's, which returns the
        // full OpenAPI document.
        const spec = responseValue as Spec;

        return {
          ...spec,
          paths: { ...spec.paths, ...paths },
          components: {
            ...components,
            ...spec.components,
            schemas: { ...components.schemas, ...spec.components.schemas },
          },
        };
      })
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
              {
                name: "Auth",
                description:
                  "Better Auth's OAuth sign-in and Session endpoints, and the signed-in User",
              },
              { name: "Handle", description: "The public and unique name of a User" },
              { name: "Duel", description: "The Duel socket, and the signed-in User's Pace" },
              { name: "Friends", description: "Finding other Users by their Handle" },
              { name: "Profile", description: "A User's Profile and their Stats" },
              { name: "Leaderboard", description: "The Classement of the ranked Users" },
            ],
          },
        }),
      )
  );
};

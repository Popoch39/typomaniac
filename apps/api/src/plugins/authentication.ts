import { Elysia } from "elysia";

import { API_PREFIX } from "../api-prefix";
import type { Auth } from "../auth";
import { ApiError } from "../errors";

// Registered under createApp's prefix.
const AUTH_ROUTE = "/auth";

// Better Auth's basePath: it routes on the full URL.
export const AUTH_PATH = `${API_PREFIX}${AUTH_ROUTE}`;

// What the app needs from a Better Auth instance: tests pass one built on the memory
// adapter, with extra plugins.
export type AuthHandler = Pick<Auth, "handler"> & {
  api: Pick<Auth["api"], "getSession" | "generateOpenAPISchema">;
};

// Better Auth's endpoints under /api/auth/*, with their own error format. Not
// `.mount("/auth", …)`: it strips the path, and Better Auth routes on the full URL.
// `parse: "none"` leaves the body unread for Better Auth.
//
// The `auth` macro protects a route: without a valid Session it throws UNAUTHORIZED
// (API error format), with one it puts `user` and `session` in the context.
export const authentication = (auth: AuthHandler) =>
  new Elysia({ name: "authentication", seed: auth })
    .all(`${AUTH_ROUTE}/*`, ({ request }) => auth.handler(request), {
      parse: "none",
      detail: { hide: true },
    })
    .macro({
      auth: {
        async resolve({ request, set }) {
          const { headers, response } = await auth.api.getSession({
            headers: request.headers,
            returnHeaders: true,
          });

          // Refreshed cookie cache or extended Session: the browser must get the new cookies.
          const cookies = headers.getSetCookie();

          if (cookies.length > 0) {
            set.headers["set-cookie"] = cookies;
          }

          if (!response) {
            throw new ApiError("UNAUTHORIZED");
          }

          return { user: response.user, session: response.session };
        },
      },
    });

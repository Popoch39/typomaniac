import { type Context, Elysia } from "elysia";

import { API_PREFIX } from "../api-prefix";
import type { Auth } from "../auth";
import { ApiError } from "../errors";
import type { UsersContext } from "../users";
import { CLIENT_IP_HEADER, clientIp } from "./client-ip";

// Registered under createApp's prefix.
const AUTH_ROUTE = "/auth";

// Better Auth's basePath: it routes on the full URL.
export const AUTH_PATH = `${API_PREFIX}${AUTH_ROUTE}`;

// What the app needs from a Better Auth instance: tests pass one built on the memory
// adapter, with extra plugins.
export type AuthHandler = Pick<Auth, "handler"> & {
  api: Pick<Auth["api"], "getSession" | "generateOpenAPISchema">;
  // Its database, for the Users (src/users.ts).
  $context: Promise<UsersContext>;
};

// Better Auth only reads the client IP from a header: it gets the one our rate limit
// uses, in place of anything the client sent under that name.
const withClientIp = (request: Request, ip: string) => {
  const headers = new Headers(request.headers);

  headers.delete(CLIENT_IP_HEADER);

  if (ip) {
    headers.set(CLIENT_IP_HEADER, ip);
  }

  return new Request(request, { headers });
};

// Better Auth's endpoints under /api/auth/*, with their own error format. Not
// `.mount("/auth", …)`: it strips the path, and Better Auth routes on the full URL.
// `parse: "none"` leaves the body unread for Better Auth.
//
// The `auth` macro protects a route: without a valid Session it throws UNAUTHORIZED
// (API error format), with one it puts `user` and `session` in the context.
export const authentication = (auth: AuthHandler, { trustProxy }: { trustProxy: boolean }) =>
  new Elysia({ name: "authentication", seed: auth })
    .all(
      `${AUTH_ROUTE}/*`,
      ({ request, server }) =>
        auth.handler(withClientIp(request, clientIp(request, server, trustProxy))),
      { parse: "none", detail: { hide: true } },
    )
    .macro({
      auth: {
        resolve: ({ request, set }) => readSession(auth, request, set, { fresh: false }),
      },
    });

// The request's Session, or UNAUTHORIZED. `fresh` reads it from the database rather than from the
// cookie cache, and caches it again: after a change of the User, the next requests see it.
export const readSession = async (
  auth: AuthHandler,
  request: Request,
  set: Context["set"],
  { fresh }: { fresh: boolean },
) => {
  const { headers, response } = await auth.api.getSession({
    headers: request.headers,
    query: { disableCookieCache: fresh },
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
};

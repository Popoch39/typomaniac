import { createAuthClient } from "better-auth/client";

import { env } from "@/env";

// Only used for the actions (OAuth redirect, dev email sign-in, sign-out): the signed-in User is read from `meQueryOptions`.
// The client sends cookies cross-origin by default (`credentials: "include"`). Better Auth keeps
// the `fetch` it finds at creation: this one looks it up at each call, as the API's client does,
// so a test stubs both the same way.
export const authClient = createAuthClient({
  baseURL: env.VITE_API_URL,
  basePath: "/api/auth",
  fetchOptions: { customFetchImpl: (input, init) => fetch(input, init) },
});

export type Provider = "github" | "google" | "discord";

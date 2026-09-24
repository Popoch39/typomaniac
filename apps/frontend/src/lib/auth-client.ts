import { createAuthClient } from "better-auth/client";

import { env } from "@/env";

// Only used for the actions (OAuth redirect, dev email sign-in, sign-out): the signed-in User is read from `meQueryOptions`.
// The client sends cookies cross-origin by default (`credentials: "include"`).
export const authClient = createAuthClient({ baseURL: env.VITE_API_URL, basePath: "/api/auth" });

export type Provider = "github" | "google" | "discord";

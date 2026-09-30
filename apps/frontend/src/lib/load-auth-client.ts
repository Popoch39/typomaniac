// Better Auth loads at the first action that needs it (OAuth redirect, sign-out): the first
// render goes without it.
export const loadAuthClient = async () => (await import("@/lib/auth-client")).authClient;

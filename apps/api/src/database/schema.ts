import * as authSchema from "./auth-schema";

// drizzle-kit reads the tables exported by this file, the client and the Better Auth
// adapter read them from `table`.
export * from "./auth-schema";

export const table = { ...authSchema } as const;

export type Table = typeof table;

import * as authSchema from "./auth-schema";
import * as duelSchema from "./duel-schema";

// drizzle-kit reads the tables exported by this file, the client and the Better Auth
// adapter read them from `table`.
export * from "./auth-schema";

export * from "./duel-schema";

export const table = { ...authSchema, ...duelSchema } as const;

export type Table = typeof table;

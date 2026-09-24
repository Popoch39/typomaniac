import * as duelSchema from "../modules/duel/schema";
import * as friendSchema from "../modules/friend/schema";
import * as authSchema from "./auth-schema";

// drizzle-kit reads the tables exported by this file, the client and the Better Auth
// adapter read them from `table`. Each module keeps its own tables.
export * from "./auth-schema";

export * from "../modules/duel/schema";

export * from "../modules/friend/schema";

export const table = { ...authSchema, ...duelSchema, ...friendSchema } as const;

export type Table = typeof table;

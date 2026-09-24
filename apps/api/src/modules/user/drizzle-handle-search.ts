import { and, like, ne, sql } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";

import { user } from "../../database/auth-schema";
import type { Table } from "../../database/schema";
import type { HandleSearch } from "./users";

// `LIKE` takes `_` and `%` as wildcards, `\` as their escape (Postgres' default).
const escapeLike = (text: string) => text.replaceAll(/[\\%_]/g, String.raw`\$&`);

// The prefix search on Postgres. Ordered byte by byte (`COLLATE "C"`), like the tests' in-memory
// search: the database's collation could ignore the `_`. A User without a Handle never matches.
export const drizzleHandleSearch =
  (db: BunSQLDatabase<Table>): HandleSearch =>
  async (prefix, { excluding, limit }) => {
    const rows = await db
      .select({ id: user.id, handle: user.handle, image: user.image })
      .from(user)
      .where(and(like(user.handle, `${escapeLike(prefix)}%`), ne(user.id, excluding)))
      .orderBy(sql`${user.handle} collate "C"`)
      .limit(limit);

    return rows.flatMap(({ id, handle, image }) =>
      handle === null ? [] : [{ id, handle, image }],
    );
  };

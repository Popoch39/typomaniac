// Writes the load test's Users straight into Postgres: each with a Handle, a 30-day Session and
// 2 × FRIENDS_EACH_WAY Friends. Idempotent: run it again with more Users to grow the set.
//
//   DATABASE_URL=postgres://…/typomaniac_loadtest bun run seed --users 5000
import { parseArgs } from "node:util";

import { SQL } from "bun";

import { friendIndexesOf, handleOf, sessionTokenOf, userIdOf } from "./users";

const { values } = parseArgs({ options: { users: { type: "string", default: "1000" } } });

const users = Number(values.users);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !Number.isInteger(users) || users < 2) {
  console.error("DATABASE_URL and --users (at least 2) are required");
  process.exit(1);
}

const sql = new SQL(databaseUrl);

const BATCH = 1000;

const SESSION_DAYS = 30;

const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

const chunksOf = <T>(rows: readonly T[]) =>
  Array.from({ length: Math.ceil(rows.length / BATCH) }, (_, chunk) =>
    rows.slice(chunk * BATCH, (chunk + 1) * BATCH),
  );

const indexes = Array.from({ length: users }, (_, index) => index);

const userRows = indexes.map((index) => ({
  id: userIdOf(index),
  name: handleOf(index),
  email: `${handleOf(index)}@loadtest.invalid`,
  handle: handleOf(index),
}));

const sessionRows = indexes.map((index) => ({
  id: sessionTokenOf(index),
  token: sessionTokenOf(index),
  user_id: userIdOf(index),
  expires_at: expiresAt,
  updated_at: new Date(),
}));

// Once per pair, the smaller id first (friendship_ordered_pair).
const pairs = new Map<string, { user_a_id: string; user_b_id: string }>();

for (const index of indexes) {
  for (const friend of friendIndexesOf(index, users)) {
    const [a, b] = [userIdOf(index), userIdOf(friend)].toSorted();

    if (a && b && a !== b) {
      pairs.set(`${a}|${b}`, { user_a_id: a, user_b_id: b });
    }
  }
}

const pairRows = [...pairs.values()];

// The Users first: Sessions and friendships reference them.
await Promise.all(
  chunksOf(userRows).map((rows) => sql`insert into "user" ${sql(rows)} on conflict do nothing`),
);

await Promise.all([
  ...chunksOf(sessionRows).map(
    (rows) =>
      sql`insert into session ${sql(rows)} on conflict (id) do update set expires_at = excluded.expires_at`,
  ),
  ...chunksOf(pairRows).map(
    (rows) => sql`insert into friendship ${sql(rows)} on conflict do nothing`,
  ),
]);

console.log(`Seeded ${users} Users, ${pairRows.length} friendships`);

await sql.close();

import { describe, expect, test } from "bun:test";

import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS = `${import.meta.dir}/../../drizzle`;

// The SQL migrations in the order drizzle applies them: their names start with their index.
const migrationFiles = async () =>
  (await Array.fromAsync(new Bun.Glob("*.sql").scan(MIGRATIONS))).toSorted();

// Migrations run in order, as one script.
const apply = async (db: PGlite, files: string[]) => {
  const scripts = await Promise.all(files.map((file) => Bun.file(`${MIGRATIONS}/${file}`).text()));

  await db.exec(scripts.join("\n"));
};

// A database with every migration applied up to `last`, excluded.
const migratedUpTo = async (last: string) => {
  const files = await migrationFiles();
  const index = files.indexOf(last);

  if (index === -1) {
    throw new Error(`no migration ${last}`);
  }

  const db = new PGlite();

  await apply(db, files.slice(0, index));

  return db;
};

const addUser = async (db: PGlite, id: string) => {
  await db.query(`insert into "user" (id, name, email) values ($1, $1, $1 || '@example.com')`, [
    id,
  ]);
};

type RatingRow = { tier: string | null; division: number | null; tp: number; shielded: boolean };

const MANIAC_TIER = "0007_maniac_tier.sql";

describe(MANIAC_TIER, () => {
  test("a User in the last Tier under its old key becomes Maniac with their TP and their shield", async () => {
    const db = await migratedUpTo(MANIAC_TIER);

    await addUser(db, "ada");
    await addUser(db, "alan");
    await db.exec(`
      insert into ranked_rating (user_id, mmr, placements_played, tier, division, tp, shielded)
      values ('ada', 1900, 5, 'maitre', null, 250, true),
             ('alan', 800, 5, 'or', 2, 40, false)
    `);

    await apply(db, [MANIAC_TIER]);

    const { rows } = await db.query<RatingRow>(
      "select tier, division, tp, shielded from ranked_rating order by user_id",
    );

    expect(rows).toEqual([
      { tier: "maniac", division: null, tp: 250, shielded: true },
      { tier: "or", division: 2, tp: 40, shielded: false },
    ]);
  });
});

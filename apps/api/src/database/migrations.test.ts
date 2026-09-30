import { describe, expect, test } from "bun:test";

import { PGlite } from "@electric-sql/pglite";
import { type Standing, stepOf } from "ranked";

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

const ORNAMENT = "0008_ornament.sql";

describe(ORNAMENT, () => {
  test("every existing Rating follows its Tier, and so does a new one", async () => {
    const db = await migratedUpTo(ORNAMENT);

    await addUser(db, "ada");
    await addUser(db, "alan");
    await db.exec(`
      insert into ranked_rating (user_id, mmr, placements_played, tier, division, tp, shielded)
      values ('ada', 1900, 5, 'maniac', null, 250, false)
    `);

    await apply(db, [ORNAMENT]);
    await db.exec(`
      insert into ranked_rating (user_id, mmr, placements_played, tier, division, tp, shielded)
      values ('alan', 600, 2, null, null, 0, false)
    `);

    const { rows } = await db.query<{ ornament: string }>(
      "select ornament from ranked_rating order by user_id",
    );

    expect(rows).toEqual([{ ornament: "follow" }, { ornament: "follow" }]);
  });
});

const ENGLISH_TIERS = "0009_english_tiers.sql";

describe(ENGLISH_TIERS, () => {
  test("every Tier and frozen Ornament takes its English id, with the same TP and shield", async () => {
    const db = await migratedUpTo(ENGLISH_TIERS);

    await addUser(db, "ada");
    await addUser(db, "alan");
    await addUser(db, "grace");
    await addUser(db, "linus");
    await addUser(db, "margaret");
    await addUser(db, "tim");
    await db.exec(`
      insert into ranked_rating (user_id, mmr, placements_played, tier, division, tp, shielded, ornament)
      values ('ada', 800, 5, 'or', 2, 40, true, 'argent'),
             ('alan', 500, 5, 'fer', 4, 0, false, 'follow'),
             ('grace', 1100, 5, 'platine', 1, 99, false, 'fer'),
             ('linus', 1300, 5, 'diamant', 3, 12, false, 'diamant'),
             ('margaret', 1900, 5, 'maniac', null, 250, false, 'platine'),
             ('tim', 600, 2, null, null, 0, false, 'none')
    `);

    await apply(db, [ENGLISH_TIERS]);

    const { rows } = await db.query<RatingRow & { ornament: string }>(
      "select tier, division, tp, shielded, ornament from ranked_rating order by user_id",
    );

    expect(rows).toEqual([
      { tier: "gold", division: 2, tp: 40, shielded: true, ornament: "silver" },
      { tier: "iron", division: 4, tp: 0, shielded: false, ornament: "follow" },
      { tier: "platinum", division: 1, tp: 99, shielded: false, ornament: "iron" },
      { tier: "diamond", division: 3, tp: 12, shielded: false, ornament: "diamond" },
      { tier: "maniac", division: null, tp: 250, shielded: false, ornament: "platinum" },
      { tier: null, division: null, tp: 0, shielded: false, ornament: "none" },
    ]);
  });
});

const LEADERBOARD_INDEX = "0010_leaderboard_index.sql";

// The step each of `standings` should get, for the Users `<prefix>-<index>`.
const stepsOf = (prefix: string, standings: Standing[]) =>
  standings.map((standing, index) => ({
    user_id: `${prefix}-${index}`,
    ladder_step: stepOf(standing),
  }));

describe(LEADERBOARD_INDEX, () => {
  test("every Rating past Placement gets its step, the same as stepOf, and so does a new one", async () => {
    const db = await migratedUpTo(LEADERBOARD_INDEX);

    const before: Standing[] = [
      { tier: "iron", division: 4, tp: 0, shielded: false },
      { tier: "gold", division: 2, tp: 40, shielded: true },
    ];

    const after: Standing[] = [
      { tier: "diamond", division: 1, tp: 99, shielded: false },
      { tier: "maniac", tp: 250, shielded: false },
    ];

    const insert = async (id: string, standing: Standing) => {
      await addUser(db, id);
      await db.query(
        `insert into ranked_rating (user_id, mmr, placements_played, tier, division, tp, shielded)
         values ($1, 1000, 5, $2, $3, $4, false)`,
        [id, standing.tier, "division" in standing ? standing.division : null, standing.tp],
      );
    };

    await Promise.all(before.map((standing, index) => insert(`before-${index}`, standing)));

    await addUser(db, "placement");
    await db.exec(`
      insert into ranked_rating (user_id, mmr, placements_played, tier, division, tp, shielded)
      values ('placement', 600, 2, null, null, 0, false)
    `);

    await apply(db, [LEADERBOARD_INDEX]);

    await Promise.all(after.map((standing, index) => insert(`after-${index}`, standing)));

    const { rows } = await db.query<{ user_id: string; ladder_step: number | null }>(
      "select user_id, ladder_step from ranked_rating order by user_id",
    );

    expect(rows).toEqual([
      ...stepsOf("after", after),
      ...stepsOf("before", before),
      { user_id: "placement", ladder_step: null },
    ]);
  });
});

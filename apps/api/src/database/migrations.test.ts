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

const BEST_RUN = "0011_best_run.sql";

describe(BEST_RUN, () => {
  test("keeps one Best Run per User and setting, gone with its User", async () => {
    const db = await migratedUpTo(BEST_RUN);

    await apply(db, [BEST_RUN]);
    await addUser(db, "ada");

    const insert = (mode: string, length: number, language: string) =>
      db.query(
        `insert into best_run (user_id, mode, length, language, seed, word_list_version, keystrokes,
           wpm, raw, accuracy, consistency, correct_chars, incorrect_chars, extra_chars,
           missed_chars, sent_at)
         values ('ada', $1, $2, $3, 4294967295, 1, '[]', 90, 95, 98, 80, 200, 3, 0, 1, now())`,
        [mode, length, language],
      );

    await insert("time", 30, "en");
    await insert("time", 60, "en");
    await insert("words", 30, "en");
    await insert("time", 30, "fr");

    await expect(insert("time", 30, "en")).rejects.toThrow();

    const count = async () =>
      (await db.query<{ count: number }>("select count(*)::int as count from best_run")).rows;

    expect(await count()).toEqual([{ count: 4 }]);

    await db.exec(`delete from "user" where id = 'ada'`);

    expect(await count()).toEqual([{ count: 0 }]);
  });
});

const DUEL_ROUNDS_FROM_PLAYERS = "0014_duel_rounds_from_players.sql";

const DUEL_PLAYER_ROUNDS_ONLY = "0015_duel_player_rounds_only.sql";

// Each User's Records over the rows of `table`, as the Stats aggregate them.
const recordsSql = (table: string) =>
  `select user_id, max(wpm) as wpm, max(score) as score, max(best_combo) as combo
   from ${table} group by user_id order by user_id`;

describe(DUEL_ROUNDS_FROM_PLAYERS, () => {
  test("every Duel becomes a Duel of one Round, with the same Seed, time, Results, Scores, Keystrokes and Records", async () => {
    const db = await migratedUpTo(DUEL_ROUNDS_FROM_PLAYERS);

    await addUser(db, "ada");
    await addUser(db, "alan");

    // A Duel won by Score, a Draw, a Forfeit and one written before the Score.
    await db.exec(`
      insert into duel (id, seed, language, word_list_version, mode, seconds, started_at, ended_at,
        outcome, winner_id, ranked)
      values ('won', 4294967295, 'en', 1, 'time', 30, '2026-09-01 10:00:00', '2026-09-01 10:00:30',
               'win', 'ada', true),
             ('drawn', 7, 'en', 1, 'time', 30, '2026-09-02 10:00:00', '2026-09-02 10:00:30',
               'draw', null, false),
             ('forfeit', 8, 'fr', 1, 'time', 30, '2026-09-03 10:00:00', '2026-09-03 10:00:12',
               'forfeit', 'alan', false),
             ('old', 9, 'en', 1, 'time', 30, '2026-08-01 10:00:00', '2026-08-01 10:00:30',
               'win', 'alan', false)
    `);

    await db.exec(`
      insert into duel_player (duel_id, user_id, wpm, raw, accuracy, consistency, correct_chars,
        incorrect_chars, extra_chars, missed_chars, pace, score, best_combo, bursts, tp_delta,
        mmr_delta, keystrokes)
      values ('won', 'ada', 92.5, 95, 98, 81, 230, 3, 1, 0, 70, 1200, 40, 3, 18, 21,
               '[{"kind":"char","char":"a","at":120}]'),
             ('won', 'alan', 71, 74, 96, 77, 180, 6, 0, 2, 65, 800, 22, 1, -15, -19, '[]'),
             ('drawn', 'ada', 60, 60, 100, 90, 150, 0, 0, 0, 70, 500, 12, 0, null, null, '[]'),
             ('drawn', 'alan', 60, 61, 100, 88, 150, 0, 0, 0, 65, 500, 14, 0, null, null, '[]'),
             ('forfeit', 'ada', 40, 42, 90, 60, 50, 5, 0, 0, 70, 150, 6, 0, null, null, '[]'),
             ('forfeit', 'alan', 55, 55, 97, 70, 70, 2, 0, 0, 65, 210, 9, 1, null, null,
               '[{"kind":"backspace","at":300}]'),
             ('old', 'ada', 110, 115, 97, 80, 270, 8, 0, 0, null, null, null, null, null, null, '[]'),
             ('old', 'alan', 120, 121, 99, 85, 300, 3, 0, 0, null, null, null, null, null, null, '[]')
    `);

    const recordsBefore = (await db.query(recordsSql("duel_player"))).rows;

    const playersBefore = (
      await db.query(`
        select p.duel_id, p.user_id, 0 as round_index, d.seed, d.started_at, d.ended_at, p.wpm,
          p.raw, p.accuracy, p.consistency, p.correct_chars, p.incorrect_chars, p.extra_chars,
          p.missed_chars, p.score, p.best_combo, p.bursts, p.keystrokes
        from duel_player p join duel d on d.id = p.duel_id
        order by p.duel_id, p.user_id
      `)
    ).rows;

    await apply(db, [DUEL_ROUNDS_FROM_PLAYERS, DUEL_PLAYER_ROUNDS_ONLY]);

    const rounds = (
      await db.query(`
        select duel_id, user_id, round_index, seed, started_at, ended_at, wpm, raw, accuracy,
          consistency, correct_chars, incorrect_chars, extra_chars, missed_chars, score,
          best_combo, bursts, keystrokes
        from duel_round order by duel_id, user_id
      `)
    ).rows;

    expect(rounds).toEqual(playersBefore);
    expect((await db.query(recordsSql("duel_round"))).rows).toEqual(recordsBefore);

    const { rows: players } = await db.query(`
      select p.duel_id, p.user_id, p.rounds_won, p.wpm, p.pace, p.tp_delta, d.rounds_to_win
      from duel_player p join duel d on d.id = p.duel_id
      order by p.duel_id, p.user_id
    `);

    expect(players).toEqual([
      {
        duel_id: "drawn",
        user_id: "ada",
        rounds_won: 0,
        wpm: 60,
        pace: 70,
        tp_delta: null,
        rounds_to_win: 1,
      },
      {
        duel_id: "drawn",
        user_id: "alan",
        rounds_won: 0,
        wpm: 60,
        pace: 65,
        tp_delta: null,
        rounds_to_win: 1,
      },
      {
        duel_id: "forfeit",
        user_id: "ada",
        rounds_won: 0,
        wpm: 40,
        pace: 70,
        tp_delta: null,
        rounds_to_win: 1,
      },
      {
        duel_id: "forfeit",
        user_id: "alan",
        rounds_won: 0,
        wpm: 55,
        pace: 65,
        tp_delta: null,
        rounds_to_win: 1,
      },
      {
        duel_id: "old",
        user_id: "ada",
        rounds_won: 0,
        wpm: 110,
        pace: null,
        tp_delta: null,
        rounds_to_win: 1,
      },
      {
        duel_id: "old",
        user_id: "alan",
        rounds_won: 1,
        wpm: 120,
        pace: null,
        tp_delta: null,
        rounds_to_win: 1,
      },
      {
        duel_id: "won",
        user_id: "ada",
        rounds_won: 1,
        wpm: 92.5,
        pace: 70,
        tp_delta: 18,
        rounds_to_win: 1,
      },
      {
        duel_id: "won",
        user_id: "alan",
        rounds_won: 0,
        wpm: 71,
        pace: 65,
        tp_delta: -15,
        rounds_to_win: 1,
      },
    ]);
  });

  test("a Round goes with its Duel and with its User", async () => {
    const db = await migratedUpTo(DUEL_ROUNDS_FROM_PLAYERS);

    await apply(db, [DUEL_ROUNDS_FROM_PLAYERS, DUEL_PLAYER_ROUNDS_ONLY]);
    await addUser(db, "ada");
    await addUser(db, "alan");
    await db.exec(`
      insert into duel (id, language, word_list_version, mode, seconds, started_at, ended_at,
        outcome, winner_id)
      values ('one', 'en', 1, 'time', 30, now(), now(), 'draw', null),
             ('two', 'en', 1, 'time', 30, now(), now(), 'draw', null)
    `);

    const round = (duelId: string, userId: string, index: number) =>
      db.query(
        `insert into duel_round (duel_id, user_id, round_index, seed, started_at, ended_at, wpm,
           raw, accuracy, consistency, correct_chars, incorrect_chars, extra_chars, missed_chars,
           keystrokes)
         values ($1, $2, $3, 1, now(), now(), 60, 60, 100, 90, 150, 0, 0, 0, '[]')`,
        [duelId, userId, index],
      );

    await round("one", "ada", 0);
    await round("one", "ada", 1);
    await round("one", "alan", 0);
    await round("two", "ada", 0);

    await expect(round("one", "ada", 1)).rejects.toThrow();

    const count = async () =>
      (await db.query<{ count: number }>("select count(*)::int as count from duel_round")).rows;

    await db.exec(`delete from duel where id = 'two'`);

    expect(await count()).toEqual([{ count: 3 }]);

    await db.exec(`delete from "user" where id = 'ada'`);

    expect(await count()).toEqual([{ count: 1 }]);
  });
});

import { ApiError } from "../../lib/errors";
import type { DuelCursor, DuelHistoryRow, DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import type { DuelHistoryEntry, DuelHistoryPage } from "./model";

// How many Duels a page of the Duel history holds.
export const DUEL_HISTORY_PAGE = 20;

export type DuelHistoryDeps = { store: DuelStore; users: Users };

const cursorOf = ({ endedAt, id }: DuelCursor) => `${endedAt}:${id}`;

// `<endedAt>:<id>`, its shape already checked by the query's schema.
const parseCursor = (cursor: string): DuelCursor => {
  const colon = cursor.indexOf(":");
  const endedAt = Number(cursor.slice(0, colon));

  if (!Number.isSafeInteger(endedAt)) {
    throw new ApiError("VALIDATION_FAILED", "Invalid cursor");
  }

  return { endedAt, id: cursor.slice(colon + 1) };
};

// The outcome seen from the reader: the winner won, the other lost, whether by Score or by Forfeit
// (the one who forfeited is the one who did not win).
const outcomeFor = (userId: string, { outcome, winnerId }: DuelHistoryRow) => {
  if (outcome === "draw") {
    return "draw";
  }

  return winnerId === userId ? "win" : "loss";
};

const entryOf = (
  userId: string,
  row: DuelHistoryRow,
  profiles: ReadonlyMap<string, NonNullable<DuelHistoryEntry["opponent"]>>,
): DuelHistoryEntry => ({
  id: row.id,
  endedAt: row.endedAt,
  opponent: row.opponent ? (profiles.get(row.opponent.userId) ?? null) : null,
  outcome: outcomeFor(userId, row),
  forfeit: row.outcome === "forfeit",
  score: row.player.score,
  opponentScore: row.opponent?.score ?? null,
  wpm: row.player.wpm,
  opponentWpm: row.opponent?.wpm ?? null,
});

// A page of the User's Duel history, the most recent first, from `before` when given. The
// opponents are read by id: their Handle of today, never their name.
export const duelHistory = async (
  { store, users }: DuelHistoryDeps,
  userId: string,
  before: string | undefined,
): Promise<DuelHistoryPage> => {
  // One more than a page: whether there is a next one.
  const rows = await store.history(userId, {
    before: before === undefined ? null : parseCursor(before),
    limit: DUEL_HISTORY_PAGE + 1,
  });

  const page = rows.slice(0, DUEL_HISTORY_PAGE);

  const opponents = await users.profilesOf([
    ...new Set(page.flatMap((row) => (row.opponent ? [row.opponent.userId] : []))),
  ]);

  const profiles = new Map(opponents.map(({ id, handle, image }) => [id, { handle, image }]));

  const last = page.at(-1);

  return {
    duels: page.map((row) => entryOf(userId, row, profiles)),
    next: rows.length > DUEL_HISTORY_PAGE && last ? cursorOf(last) : null,
  };
};

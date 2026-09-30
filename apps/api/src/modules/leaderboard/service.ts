import { ApiError } from "../../lib/errors";
import {
  type DuelStore,
  type LeaderboardKey,
  leaderboardKeyOf,
  type LeaderboardRow,
} from "../duel/store";
import type { PublicUser } from "../user/public-user";
import { publicUsersOf } from "../user/public-users";
import type { Users } from "../user/users";
import {
  LEADERBOARD_PAGE,
  type Leaderboard,
  type LeaderboardEntry,
  type LeaderboardQuery,
} from "./model";

export type LeaderboardDeps = { store: DuelStore; users: Users };

// The rows of a page and the Place of its first one.
type Page = { rows: LeaderboardRow[]; firstPlace: number };

// What a cursor holds once decoded: a row's key, `<step>:<tp>:<userId>`.
const KEY_TEXT = /^(\d+):(-?\d+):(.+)$/;

// Opaque in the URL: the row's key in base64url, the reader never edits it by hand.
const cursorOf = (row: LeaderboardRow) => {
  const { step, tp, userId } = leaderboardKeyOf(row);

  return Buffer.from(`${step}:${tp}:${userId}`).toString("base64url");
};

// A cursor of `cursorOf`, its alphabet already checked by the query's schema.
const parseCursor = (cursor: string): LeaderboardKey => {
  const [, stepText, tpText, userId] =
    KEY_TEXT.exec(Buffer.from(cursor, "base64url").toString()) ?? [];

  const step = Number(stepText);
  const tp = Number(tpText);

  if (userId === undefined || !Number.isSafeInteger(step) || !Number.isSafeInteger(tp)) {
    throw new ApiError("VALIDATION_FAILED", "Invalid cursor");
  }

  return { step, tp, userId };
};

// A row of the Leaderboard as the page shows it: null for a User without a Handle.
const entryOf = (
  { userId, standing }: LeaderboardRow,
  place: number,
  profiles: ReadonlyMap<string, PublicUser>,
): LeaderboardEntry | null => {
  const profile = profiles.get(userId);

  return profile
    ? {
        place,
        handle: profile.handle,
        image: profile.image,
        ornament: profile.ornament,
        rank: standing,
      }
    : null;
};

const firstPage = async (store: DuelStore): Promise<Page> => ({
  rows: await store.leaderboardAfter(null, LEADERBOARD_PAGE),
  firstPlace: 1,
});

// The page after or before a cursor, or the first one. A page past either end of the Leaderboard,
// whose cursor has since been left behind, is its first page.
const pageAt = async (
  store: DuelStore,
  { after, before }: Pick<LeaderboardQuery, "after" | "before">,
): Promise<Page> => {
  const rows =
    typeof after !== "undefined"
      ? await store.leaderboardAfter(parseCursor(after), LEADERBOARD_PAGE)
      : typeof before !== "undefined"
        ? await store.leaderboardBefore(parseCursor(before), LEADERBOARD_PAGE)
        : [];

  const [first] = rows;

  return first
    ? { rows, firstPlace: await store.leaderboardPlace(leaderboardKeyOf(first)) }
    : firstPage(store);
};

// The page the reader stands on, the same as the one reached from the first page: it starts at a
// Place of 1, 26, 51…
const readerPage = async (store: DuelStore, reader: LeaderboardRow, place: number) => {
  const key = leaderboardKeyOf(reader);
  const aboveCount = (place - 1) % LEADERBOARD_PAGE;

  const [above, below] = await Promise.all([
    store.leaderboardBefore(key, aboveCount),
    store.leaderboardAfter(key, LEADERBOARD_PAGE - aboveCount - 1),
  ]);

  return { rows: [...above, reader, ...below], firstPlace: place - above.length };
};

// A page of the Leaderboard, with the Handle of today of its Users (a User without one is left
// out, their Place kept) and their Ornament, and where the reader stands in it.
export const leaderboardOf = async (
  { store, users }: LeaderboardDeps,
  readerId: string,
  query: LeaderboardQuery,
): Promise<Leaderboard> => {
  if ([query.after, query.before, query.at].filter((given) => given !== undefined).length > 1) {
    throw new ApiError("VALIDATION_FAILED", "Only one of after, before and at");
  }

  const [rank, total] = await Promise.all([store.rankOf(readerId), store.leaderboardSize()]);

  const reader: LeaderboardRow | null =
    rank === null || "placementsLeft" in rank ? null : { userId: readerId, standing: rank };

  const [readerPlace, shownPage] = await Promise.all([
    reader === null ? null : store.leaderboardPlace(leaderboardKeyOf(reader)),
    query.at === "me" ? null : pageAt(store, query),
  ]);

  const page =
    shownPage ??
    (reader === null || readerPlace === null
      ? await firstPage(store)
      : await readerPage(store, reader, readerPlace));

  const userIds = page.rows.map((row) => row.userId);

  const profiles = new Map(
    (await publicUsersOf(users, store, reader === null ? userIds : [...userIds, readerId])).map(
      (profile) => [profile.id, profile],
    ),
  );

  const first = page.rows.at(0);
  const last = page.rows.at(-1);
  const lastPlace = page.firstPlace + page.rows.length - 1;

  return {
    entries: page.rows.flatMap(
      (row, index) => entryOf(row, page.firstPlace + index, profiles) ?? [],
    ),
    me: reader === null || readerPlace === null ? null : entryOf(reader, readerPlace, profiles),
    firstPlace: page.firstPlace,
    lastPlace,
    total,
    previous: first && page.firstPlace > 1 ? cursorOf(first) : null,
    next: last && lastPlace < total ? cursorOf(last) : null,
  };
};

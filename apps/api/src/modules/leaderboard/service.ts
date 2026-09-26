import type { DuelStore, LeaderboardRow } from "../duel/store";
import type { PublicUser } from "../user/public-user";
import { publicUsersOf } from "../user/public-users";
import type { Users } from "../user/users";
import { LEADERBOARD_LIMIT, type Leaderboard, type LeaderboardEntry } from "./model";

export type LeaderboardDeps = { store: DuelStore; users: Users };

// A row of the Classement as the page shows it: null for a User without a Handle.
const entryOf = (
  { userId, position, standing }: LeaderboardRow,
  profiles: ReadonlyMap<string, PublicUser>,
): LeaderboardEntry | null => {
  const profile = profiles.get(userId);

  return profile
    ? {
        position,
        handle: profile.handle,
        image: profile.image,
        ornament: profile.ornament,
        rank: standing,
      }
    : null;
};

// The Classement's first Users, with their Handle of today (a User without one is left out, their
// place kept) and their Ornament, and where the reader stands in it.
export const leaderboardOf = async (
  { store, users }: LeaderboardDeps,
  readerId: string,
): Promise<Leaderboard> => {
  const [rows, position, rank] = await Promise.all([
    store.leaderboard(LEADERBOARD_LIMIT),
    store.leaderboardPosition(readerId),
    store.rankOf(readerId),
  ]);

  const standing = rank === null || "placementsLeft" in rank ? null : rank;

  const reader: LeaderboardRow | null =
    position === null || standing === null ? null : { userId: readerId, position, standing };

  const userIds = rows.map((row) => row.userId);

  const profiles = new Map(
    (await publicUsersOf(users, store, reader === null ? userIds : [...userIds, readerId])).map(
      (profile) => [profile.id, profile],
    ),
  );

  return {
    entries: rows.flatMap((row) => entryOf(row, profiles) ?? []),
    me: reader === null ? null : entryOf(reader, profiles),
  };
};

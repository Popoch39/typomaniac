import { ApiError } from "../../lib/errors";
import { type DuelStore, readRankAndOrnament } from "../duel/store";
import type { Users } from "../user/users";
import type { Profile, ProgressionWindow } from "./model";

const progressionLimits = { "50": 50, "200": 200, all: null } as const;

export type ProfileDeps = { store: DuelStore; users: Users };

// The Profile of the User who holds `handle` today, whatever its case: a Handle given up finds
// nobody. `window` bounds the Progression only, never the rest of the Stats.
export const profileOfHandle = async (
  { store, users }: ProfileDeps,
  handle: string,
  window: ProgressionWindow,
): Promise<Profile> => {
  const userId = await users.idOfHandle(handle.toLowerCase());

  const profile = userId === null ? null : await users.profileOf(userId);

  if (userId === null || profile?.handle == null) {
    throw new ApiError("NOT_FOUND", "User not found");
  }

  const [stats, progression, { rank, ornament }] = await Promise.all([
    store.stats(userId),
    store.progression(userId, progressionLimits[window]),
    readRankAndOrnament(store, userId),
  ]);

  return {
    handle: profile.handle,
    image: profile.image,
    rank,
    ornament,
    stats: { ...stats, progression },
  };
};

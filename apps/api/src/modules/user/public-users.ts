import type { Tier } from "ranked";

import { type DuelStore, readOrnaments } from "../duel/store";
import type { PublicUser } from "./public-user";
import type { HandleMatch, Users } from "./users";

// Each User with the Ornament they wear, from the Ornaments read at once.
export const withOrnaments = (
  matches: readonly HandleMatch[],
  ornaments: ReadonlyMap<string, Tier>,
): PublicUser[] =>
  matches.map((match) => ({ ...match, ornament: ornaments.get(match.id) ?? null }));

// Those of `userIds` who have a Handle, in no given order, each with their Ornament: one read of
// the Users and one of the Ratings, whatever the number of Users.
export const publicUsersOf = async (
  users: Users,
  duelStore: DuelStore,
  userIds: readonly string[],
): Promise<PublicUser[]> => {
  const [matches, ornaments] = await Promise.all([
    users.profilesOf(userIds),
    readOrnaments(duelStore, userIds),
  ]);

  return withOrnaments(matches, ornaments);
};

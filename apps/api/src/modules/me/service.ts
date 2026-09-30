import { canWear, isPlacement, type OrnamentChoice, type Rank } from "ranked";

import { ApiError } from "../../lib/errors";
import { type DuelStore, leaderboardKeyOf, readRankAndOrnamentChoice } from "../duel/store";
import type { Me } from "./model";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  handle?: string | null;
};

// The User's Place in the Leaderboard: null where it leaves them out, in Placement, without a
// Rating or without a Handle.
const placeOf = (store: DuelStore, userId: string, handle: string | null, rank: Rank | null) =>
  handle === null || rank === null || isPlacement(rank)
    ? null
    : store.leaderboardPlace(leaderboardKeyOf({ userId, standing: rank }));

// The signed-in User as /api/me shows them: their rank, never their MMR, their Ornament and their
// Place in the Leaderboard.
export const meOf = async (store: DuelStore, user: SessionUser): Promise<Me> => {
  const handle = user.handle ?? null;
  const rankAndOrnament = await readRankAndOrnamentChoice(store, user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    handle,
    ...rankAndOrnament,
    place: await placeOf(store, user.id, handle, rankAndOrnament.rank),
  };
};

// Writes the User's Ornament choice: 403 when they may not wear it (a Tier above their own, in
// Placement or without a Rating), and then nothing changes.
export const setOrnament = async (store: DuelStore, userId: string, choice: OrnamentChoice) => {
  const rank = await store.rankOf(userId);

  if (rank === null || !canWear(rank, choice)) {
    throw new ApiError("FORBIDDEN", "You cannot wear this Ornament", [
      { path: "/choice", message: rank === null ? "unranked" : "locked" },
    ]);
  }

  await store.setOrnamentChoice(userId, choice);
};

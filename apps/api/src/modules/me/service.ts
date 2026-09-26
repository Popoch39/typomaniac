import { canWear, type OrnamentChoice } from "ranked";

import { ApiError } from "../../lib/errors";
import { type DuelStore, readRankAndOrnamentChoice } from "../duel/store";
import type { Me } from "./model";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  handle?: string | null;
};

// The signed-in User as /api/me shows them: their rank, never their MMR, and their Ornament.
export const meOf = async (store: DuelStore, user: SessionUser): Promise<Me> => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
  handle: user.handle ?? null,
  ...(await readRankAndOrnamentChoice(store, user.id)),
});

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

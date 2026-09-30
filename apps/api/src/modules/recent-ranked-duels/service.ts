import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import type { RecentRankedDuels } from "./model";

// How many Duels Jouer's Ranked card lists.
export const RECENT_RANKED_DUELS = 3;

export type RecentRankedDuelsDeps = { store: DuelStore; users: Users };

// The last Ranked Duels won by a User of the reader's Tier of today, or of every Tier while the
// reader has none (in Placement, or before their first Duel). Each player by their Handle of
// today; a Duel whose players cannot both be read is left out.
export const recentRankedDuels = async (
  { store, users }: RecentRankedDuelsDeps,
  readerId: string,
): Promise<RecentRankedDuels> => {
  const rank = await store.rankOf(readerId);
  const tier = rank !== null && "tier" in rank ? rank.tier : null;
  const duels = await store.recentWonRankedDuels(tier, RECENT_RANKED_DUELS);

  const profiles = new Map(
    (
      await users.profilesOf([
        ...new Set(duels.flatMap(({ winner, loser }) => [winner.userId, loser.userId])),
      ])
    ).map((profile) => [profile.id, profile.handle]),
  );

  return {
    tier,
    duels: duels.flatMap(({ id, endedAt, winner, loser }) => {
      const winnerHandle = profiles.get(winner.userId);
      const loserHandle = profiles.get(loser.userId);

      return winnerHandle === undefined || loserHandle === undefined
        ? []
        : [
            {
              id,
              endedAt,
              winner: { handle: winnerHandle, wpm: winner.wpm },
              loser: { handle: loserHandle, wpm: loser.wpm },
            },
          ];
    }),
  };
};

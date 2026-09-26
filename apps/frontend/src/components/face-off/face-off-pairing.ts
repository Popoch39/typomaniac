import type { DuelPlay } from "@/stores/duel-store";

// Each player's rank and Form at the pairing, and this User's Stake, as the Face-off shows them:
// never the MMR.
export type FaceOffPairing = Pick<
  DuelPlay,
  "selfRank" | "opponentRank" | "selfForm" | "opponentForm" | "selfStake"
>;

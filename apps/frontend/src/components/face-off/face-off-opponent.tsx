import type { Rank } from "ranked";

import { FaceOffPanel } from "@/components/face-off/face-off-panel";
import { FaceOffRank } from "@/components/face-off/face-off-rank";
import type { DuelOpponent } from "@/stores/duel-store";

type FaceOffOpponentProps = { opponent: DuelOpponent; rank: Rank | null };

// The opponent's side of the Face-off, on the right: their avatar, their Handle and their rank at
// the pairing, or the Challenge badge.
export const FaceOffOpponent = ({ opponent, rank }: FaceOffOpponentProps) => (
  <FaceOffPanel side="opponent" handle={opponent.handle} image={opponent.image}>
    <FaceOffRank rank={rank} />
  </FaceOffPanel>
);

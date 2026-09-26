import type { Form } from "api";
import type { Rank } from "ranked";

import { FaceOffForm } from "@/components/face-off/face-off-form";
import { FaceOffPanel } from "@/components/face-off/face-off-panel";
import { FaceOffRank } from "@/components/face-off/face-off-rank";
import type { DuelOpponent } from "@/stores/duel-store";

type FaceOffOpponentProps = { opponent: DuelOpponent; rank: Rank | null; form: Form | null };

// The opponent's side of the Face-off, on the right: their avatar with their Ornament, their
// Handle, their rank at the pairing (or the Challenge badge) and their Form.
export const FaceOffOpponent = ({ opponent, rank, form }: FaceOffOpponentProps) => (
  <FaceOffPanel
    side="opponent"
    handle={opponent.handle}
    image={opponent.image}
    ornament={opponent.ornament}
  >
    <FaceOffRank rank={rank} />
    <FaceOffForm form={form} />
  </FaceOffPanel>
);

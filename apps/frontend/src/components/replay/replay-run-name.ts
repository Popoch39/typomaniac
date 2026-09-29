import type { DuelSide } from "@/components/replay/replay-sides";

// A Run of the Replay named by its player, as the choice of the Run and the Text say it.
export const replayRunName = (side: DuelSide, opponentName: string) =>
  side === "own" ? "Mon Run" : `Run de ${opponentName}`;

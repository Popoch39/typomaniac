import { cn } from "cn";

import type { DuelSide } from "@/components/replay/replay-sides";

const toneClassNames: Record<DuelSide, string> = {
  own: "text-caret",
  opponent: "text-opponent-caret",
};

type ReplayTextTitleProps = { side: DuelSide; opponentName: string };

// Whose Run the Replay shows, in that player's colour.
export const ReplayTextTitle = ({ side, opponentName }: ReplayTextTitleProps) => (
  <h2 className={cn("text-sm font-semibold", toneClassNames[side])}>
    {side === "own" ? "Ton run" : `Run de ${opponentName}`}
  </h2>
);

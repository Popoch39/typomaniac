import { RankChip } from "@/components/tier/rank-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import type { Rank } from "ranked";

import type { DuelOpponent } from "@/stores/duel-store";

type DuelFoundProps = { opponent: DuelOpponent; rank: Rank | null };

// Who the opponent is, above the Duel's Text: their Handle and avatar, never their name, and
// their rank when given (during the Countdown of a Duel of the Queue).
export const DuelFound = ({ opponent, rank }: DuelFoundProps) => (
  <output className="flex items-center justify-center gap-3 self-center rounded-full bg-card py-2 pr-5 pl-2">
    <Avatar>
      {opponent.image ? <AvatarImage src={opponent.image} alt="" /> : null}
      <AvatarFallback>{opponent.handle.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
    <span className="flex flex-col">
      <span className="text-lg">
        Duel contre{" "}
        <span className="font-bold text-opponent-caret">{atHandle(opponent.handle)}</span>
      </span>
      {rank ? <RankChip rank={rank} /> : null}
    </span>
  </output>
);

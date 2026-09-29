import { cn } from "cn";

import type { DuelHistoryEntry } from "@/api/duel-history";
import { duelNumber } from "@/components/duel-history/duel-number";
import { DuelHistoryOpponent } from "@/components/duel-history/duel-history-opponent";
import { DuelHistoryTp } from "@/components/duel-history/duel-history-tp";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";
import { opponentName } from "@/lib/opponent-name";

type DuelHistoryItemProps = { duel: DuelHistoryEntry; chosen: boolean; onChoose: () => void };

// One Duel of the Duel history, from the User's side: against whom and when, both Scores (theirs
// first), how it ended and its TP. A click chooses it: its details show beside the list.
export const DuelHistoryItem = ({ duel, chosen, onChoose }: DuelHistoryItemProps) => (
  <li
    className={cn(
      "relative flex h-16.5 items-center gap-3.5 rounded-[20px] px-4",
      chosen ? "bg-primary/16" : "has-[button:hover]:bg-muted",
      "has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring",
    )}
  >
    <DuelHistoryOpponent opponent={duel.opponent} endedAt={duel.endedAt} forfeit={duel.forfeit} />
    {/* The button stretches over the whole row; the opponent's Handle stays above it. */}
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onChoose}
      className="flex items-center gap-3.5 text-left outline-none after:absolute after:inset-0 after:rounded-[20px]"
    >
      <span className="sr-only">Duel contre {opponentName(duel.opponent)}</span>
      {/* Each User keeps their colour: the accent for the User, opponent for the other. */}
      <span className="flex flex-col items-end gap-0.75 font-mono font-semibold tabular-nums">
        <span className="text-sm text-caret">{duelNumber(duel.score)}</span>
        <span className="text-xs text-opponent-caret">{duelNumber(duel.opponentScore)}</span>
      </span>
      <span className="flex w-21 flex-col items-end gap-0.75">
        {/* The Forfeit is said under the Handle, beside the date. */}
        <FinishedDuelOutcome outcome={duel.outcome} forfeit={false} className="text-sm" />
        <DuelHistoryTp tp={duel.tp} ranked={duel.ranked} />
      </span>
    </button>
  </li>
);

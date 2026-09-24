import { Suspense } from "react";

import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelDetails } from "@/components/duel-chart/duel-details";
import { DuelOpponentLabel } from "@/components/duel-history/duel-opponent-label";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";

// A Score or a wpm that is not there: a Duel before the Score, a deleted opponent.
const orDash = (value: number | null) => (value === null ? "—" : String(Math.round(value)));

type DuelHistoryItemProps = { duel: DuelHistoryEntry; open: boolean; onToggle: () => void };

// One Duel of the Duel history, from the User's side: when, against whom, how it ended, both Scores
// and both wpm (theirs first). A click opens its details under it, another closes them.
export const DuelHistoryItem = ({ duel, open, onToggle }: DuelHistoryItemProps) => (
  <li>
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
    >
      <DuelOpponentLabel opponent={duel.opponent} endedAt={duel.endedAt} />
      <FinishedDuelOutcome outcome={duel.outcome} forfeit={duel.forfeit} />
      <span className="tabular-nums">
        <span className="text-[0.7rem] text-muted-foreground">Score </span>
        {orDash(duel.score)} – {orDash(duel.opponentScore)}
      </span>
      <span className="text-muted-foreground tabular-nums">
        {orDash(duel.wpm)} – {orDash(duel.opponentWpm)} wpm
      </span>
    </button>
    {open ? (
      <Suspense
        fallback={<p className="px-3 py-4 text-[0.7rem] text-muted-foreground">Chargement…</p>}
      >
        <DuelDetails duelId={duel.id} />
      </Suspense>
    ) : null}
  </li>
);

import { Link } from "@tanstack/react-router";

import type { DuelHistoryEntry } from "@/api/duel-history";
import { DuelOpponentLabel } from "@/components/duel-history/duel-opponent-label";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";

// A Score or a wpm that is not there: a Duel before the Score, a deleted opponent.
const orDash = (value: number | null) => (value === null ? "—" : String(Math.round(value)));

// One Duel of the Duel history, from the User's side: when, against whom, how it ended, both Scores
// and both wpm (theirs first). It leads to the Duel's Replay.
export const DuelHistoryItem = ({ duel }: { duel: DuelHistoryEntry }) => (
  <li>
    <Link
      to="/duels/$duelId"
      params={{ duelId: duel.id }}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 outline-none hover:bg-muted focus-visible:bg-muted"
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
    </Link>
  </li>
);

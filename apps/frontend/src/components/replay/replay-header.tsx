import type { ReplayedDuel } from "@/api/duel-history";
import { FinishedDuelOutcome } from "@/components/duel-history/finished-duel-outcome";
import { DuelOpponentLabel } from "@/components/replay/duel-opponent-label";

// Atop the Replay: against whom, when, and how the Duel ended for the User.
export const ReplayHeader = ({ duel }: { duel: ReplayedDuel }) => (
  <header className="flex flex-wrap items-center gap-4 rounded-card bg-card px-6 py-5">
    <DuelOpponentLabel opponent={duel.opponent} endedAt={duel.endedAt} />
    <FinishedDuelOutcome outcome={duel.outcome} forfeit={duel.forfeit} className="text-xl" />
  </header>
);

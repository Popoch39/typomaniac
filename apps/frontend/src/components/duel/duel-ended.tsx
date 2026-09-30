import { useCallback, useRef } from "react";

import { DuelTierUp } from "@/components/duel/duel-tier-up";
import { DuelEndActions } from "@/components/duel-end/duel-end-actions";
import { DuelEndChart } from "@/components/duel-end/duel-end-chart";
import { DuelEndOutcome } from "@/components/duel-end/duel-end-outcome";
import { DuelEndRank } from "@/components/duel-end/duel-end-rank";
import { DuelEndScores } from "@/components/duel-end/duel-end-scores";
import { DuelEndTape } from "@/components/duel-end/duel-end-tape";
import { atHandle } from "@/lib/at-handle";
import type { DuelEnding } from "@/stores/duel-store";

// The server ended the Duel, told as the board « B · Affiche » draws it: its outcome, both Scores
// in one band, what it did to the rank when ranked, both players' figures line by line; once
// written, its Duel chart and Revoir to replay it. Then back to the play page: Nouveau Duel joins
// the Queue again, Retour au Solo does not.
// A move up into a new Tier or Maniac opens its Tier-up over it first; the focus comes back here
// once it is closed.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const opponent = atHandle(ending.opponent.handle);
  const screen = useRef<HTMLDivElement | null>(null);

  // Called once with the node on mount, which takes the focus: the typing input is gone with the
  // Duel.
  const mount = useCallback((node: HTMLDivElement | null) => {
    screen.current = node;
    node?.focus();
  }, []);

  return (
    <div
      ref={mount}
      tabIndex={-1}
      className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 outline-none"
    >
      <DuelEndOutcome outcome={ending.outcome} forfeit={ending.forfeit} opponent={opponent} />
      <DuelEndScores
        score={ending.score.score}
        opponentScore={ending.opponentScore.score}
        opponent={opponent}
      />
      {ending.ranked === null ? null : (
        <>
          <DuelEndRank ranked={ending.ranked} />
          <DuelTierUp ranked={ending.ranked} onClosed={() => screen.current?.focus()} />
        </>
      )}
      <DuelEndTape ending={ending} opponent={opponent} />
      {ending.duelId === null ? null : <DuelEndChart duelId={ending.duelId} />}
      <DuelEndActions duelId={ending.duelId} />
    </div>
  );
};

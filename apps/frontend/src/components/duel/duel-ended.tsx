import { useCallback, useRef, useState } from "react";

import { rankChange, tierReached } from "@/components/duel/rank-change";
import { DuelEndActions } from "@/components/duel-end/duel-end-actions";
import { DuelEndChart } from "@/components/duel-end/duel-end-chart";
import { DuelEndOutcome } from "@/components/duel-end/duel-end-outcome";
import { DuelEndRank } from "@/components/duel-end/duel-end-rank";
import { DuelEndRecords } from "@/components/duel-end/duel-end-records";
import { DuelEndScores } from "@/components/duel-end/duel-end-scores";
import { DuelEndTape } from "@/components/duel-end/duel-end-tape";
import { beatenRecords, recordTiles } from "@/components/duel-end/record-tiles";
import { useDuelEndEntrance } from "@/components/duel-end/use-duel-end-entrance";
import { TierUp } from "@/components/tier-up/tier-up";
import { atHandle } from "@/lib/at-handle";
import type { DuelEnding } from "@/stores/duel-store";

// The server ended the Duel, told as the board « B · Affiche » draws it: its outcome, both Scores
// in one band, what it did to the rank when ranked, the User's Records against it when read, both
// players' figures line by line; once written, its Duel chart and Revoir to replay it. Then back
// to the play page: Nouveau Duel joins the Queue again, Retour au Solo does not. It comes in block
// by block, as soon as it is seen.
// A move up into a new Tier or Maniac opens its Tier-up over it first, once: the screen waits
// under it, then comes in and takes the focus back once it is closed.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const opponent = atHandle(ending.opponent.handle);
  const screen = useRef<HTMLDivElement | null>(null);
  const tiles = recordTiles(ending);
  const beaten = beatenRecords(tiles);
  const reached = ending.ranked === null ? null : tierReached(rankChange(ending.ranked));
  const [tierUpOpen, setTierUpOpen] = useState(reached !== null);

  useDuelEndEntrance(screen, tierUpOpen);

  // Called once with the node on mount, which takes the focus: the typing input is gone with the
  // Duel.
  const mount = useCallback((node: HTMLDivElement | null) => {
    screen.current = node;
    node?.focus();
  }, []);

  const closeTierUp = () => {
    setTierUpOpen(false);
    screen.current?.focus();
  };

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
        record={beaten.has("score")}
      />
      {ending.ranked === null ? null : <DuelEndRank ranked={ending.ranked} />}
      {reached !== null && tierUpOpen ? (
        <TierUp from={reached.from} to={reached.to} onClose={closeTierUp} />
      ) : null}
      {tiles === null ? null : <DuelEndRecords tiles={tiles} />}
      <DuelEndTape ending={ending} opponent={opponent} beaten={beaten} />
      {ending.duelId === null ? null : <DuelEndChart duelId={ending.duelId} />}
      <DuelEndActions duelId={ending.duelId} />
    </div>
  );
};

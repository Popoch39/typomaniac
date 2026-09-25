import { lazy, Suspense } from "react";

import { DuelOutcome } from "@/components/duel/duel-outcome";
import { DuelRank } from "@/components/duel/duel-rank";
import { NothingOnError } from "@/components/duel/nothing-on-error";
import { PlayerResult } from "@/components/duel/player-result";
import { ReplayDuelLink } from "@/components/duel/replay-duel-link";
import { Button } from "@/components/ui/button";
import { LoadingRegion } from "@/components/ui/loading-region";
import { DuelChartSkeleton } from "@/components/duel-chart/duel-chart-skeleton";
import { atHandle } from "@/lib/at-handle";
import { type DuelEnding, useDuelStore } from "@/stores/duel-store";

// recharts stays out of the home page's bundle until a Duel ends.
const WrittenDuelChart = lazy(async () => {
  const module = await import("@/components/duel/written-duel-chart");

  return { default: module.WrittenDuelChart };
});

// Called once with the node on mount: the typing input is gone with the Duel.
const focusOnMount = (node: HTMLElement | null) => node?.focus();

// The server ended the Duel: its outcome, what it did to the rank when ranked, and both Scores and
// Results, the same on both screens, then Nouveau Duel to join the Queue again. Once written, its Duel chart and Revoir to replay it.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const joinQueue = useDuelStore((store) => store.joinQueue);
  const opponent = atHandle(ending.opponent.handle);

  return (
    <div ref={focusOnMount} tabIndex={-1} className="flex flex-col gap-8 outline-none">
      <DuelOutcome outcome={ending.outcome} forfeit={ending.forfeit} opponent={opponent} />
      {ending.ranked === null ? null : <DuelRank ranked={ending.ranked} />}
      <div className="grid gap-8 md:grid-cols-2">
        <PlayerResult name="Toi" result={ending.result} score={ending.score} />
        <PlayerResult
          name={opponent}
          result={ending.opponentResult}
          score={ending.opponentScore}
          opponent
        />
      </div>
      {ending.duelId === null ? null : (
        <NothingOnError>
          <Suspense
            fallback={
              <LoadingRegion label="Chargement du Duel chart">
                <DuelChartSkeleton />
              </LoadingRegion>
            }
          >
            <WrittenDuelChart duelId={ending.duelId} />
          </Suspense>
        </NothingOnError>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={joinQueue}>
          Nouveau Duel
        </Button>
        {ending.duelId === null ? null : <ReplayDuelLink duelId={ending.duelId} />}
      </div>
    </div>
  );
};

import { lazy, Suspense, useCallback, useRef } from "react";

import { DuelOutcome } from "@/components/duel/duel-outcome";
import { DuelRank } from "@/components/duel/duel-rank";
import { DuelTierUp } from "@/components/duel/duel-tier-up";
import { NothingOnError } from "@/components/duel/nothing-on-error";
import { PlayerResult } from "@/components/duel/player-result";
import { ReplayDuelLink } from "@/components/duel/replay-duel-link";
import { useSearchDuel } from "@/components/duel/use-search-duel";
import { Button } from "@/components/ui/button";
import { LoadingRegion } from "@/components/ui/loading-region";
import { DuelChartSkeleton } from "@/components/duel-chart/duel-chart-skeleton";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";

// recharts stays out of the home page's bundle until a Duel ends.
const WrittenDuelChart = lazy(async () => {
  const module = await import("@/components/duel/written-duel-chart");

  return { default: module.WrittenDuelChart };
});

// The server ended the Duel: its outcome, what it did to the rank when ranked, and both Scores and
// Results, the same on both screens, then Nouveau Duel to join the Queue again. Once written, its Duel chart and Revoir to replay it.
// A move up into a new Tier or Maniac opens its Tier-up over it first; the focus comes back here
// once it is closed.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const searchDuel = useSearchDuel();
  const locale = useLocale();
  const opponent = atHandle(ending.opponent.handle);
  const screen = useRef<HTMLDivElement | null>(null);

  // Called once with the node on mount, which takes the focus: the typing input is gone with the
  // Duel.
  const mount = useCallback((node: HTMLDivElement | null) => {
    screen.current = node;
    node?.focus();
  }, []);

  return (
    <div ref={mount} tabIndex={-1} className="flex flex-col gap-8 outline-none">
      <DuelOutcome outcome={ending.outcome} forfeit={ending.forfeit} opponent={opponent} />
      {ending.ranked === null ? null : (
        <>
          <DuelRank ranked={ending.ranked} />
          <DuelTierUp ranked={ending.ranked} onClosed={() => screen.current?.focus()} />
        </>
      )}
      <div className="grid gap-8 md:grid-cols-2">
        <PlayerResult
          name={m.duel_self({}, { locale })}
          result={ending.result}
          score={ending.score}
        />
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
              <LoadingRegion label={m.duel_ended_chart_loading({}, { locale })}>
                <DuelChartSkeleton />
              </LoadingRegion>
            }
          >
            <WrittenDuelChart duelId={ending.duelId} />
          </Suspense>
        </NothingOnError>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={searchDuel}>
          {m.duel_ended_new_duel({}, { locale })}
        </Button>
        {ending.duelId === null ? null : <ReplayDuelLink duelId={ending.duelId} />}
      </div>
    </div>
  );
};

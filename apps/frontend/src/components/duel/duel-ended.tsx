import { cn } from "cn";
import { useCallback, useRef, useState } from "react";

import { rankChange, tierReached } from "@/components/duel/rank-change";
import { DuelEndActions } from "@/components/duel-end/duel-end-actions";
import { DuelEndChart } from "@/components/duel-end/duel-end-chart";
import { DuelEndOutcome } from "@/components/duel-end/duel-end-outcome";
import { DuelEndRank } from "@/components/duel-end/duel-end-rank";
import { DuelEndRecords } from "@/components/duel-end/duel-end-records";
import { DuelEndScores } from "@/components/duel-end/duel-end-scores";
import { DuelEndSeries } from "@/components/duel-end/duel-end-series";
import { bestRoundFigures, isSeries } from "@/components/duel-end/ending-rounds";
import { DuelEndTape } from "@/components/duel-end/duel-end-tape";
import { beatenRecords, recordTiles } from "@/components/duel-end/record-tiles";
import { useDuelEndEntrance } from "@/components/duel-end/use-duel-end-entrance";
import { TierUp } from "@/components/tier-up/tier-up";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";

// The Tier-up of a move up into a new Tier: to open once the band and the outcome are in, open,
// or closed (none, or gone once seen).
type TierUpStage = "ahead" | "open" | "closed";

// The server ended the Duel, told as the board « B · Affiche » draws it: its outcome, both Scores
// in one band, what it did to the rank when ranked, the User's Records against it when read, both
// players' figures line by line, its Duel chart and Revoir to replay it. Then back
// to the play page: Nouveau Duel joins the Queue again, Retour au Solo does not. It comes in block
// by block, as soon as it is seen.
// A move up into a new Tier or Maniac opens its Tier-up over it once the outcome and the band are
// in, once: the rest waits under it, then comes in and the screen takes the focus back once it is
// closed.
export const DuelEnded = ({ ending }: { ending: DuelEnding }) => {
  const locale = useLocale();
  const opponent = atHandle(ending.opponent.handle);
  const screen = useRef<HTMLDivElement | null>(null);
  const series = isSeries(ending);
  const tiles = recordTiles({ ...bestRoundFigures(ending), records: ending.records });
  const beaten = beatenRecords(tiles);
  const reached = ending.ranked === null ? null : tierReached(rankChange(ending.ranked));
  const [tierUp, setTierUp] = useState<TierUpStage>(reached === null ? "closed" : "ahead");

  const comeIn = useDuelEndEntrance(screen, {
    ahead: tierUp === "ahead",
    open: () => setTierUp("open"),
  });

  // Called once with the node on mount, before the first frame: the screen shows from the top of
  // the page, at once, and takes the focus without scrolling to it (the typing input is gone with
  // the Duel).
  const mount = useCallback((node: HTMLDivElement | null) => {
    screen.current = node;

    if (node === null) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    node.focus({ preventScroll: true });
  }, []);

  const closeTierUp = () => {
    setTierUp("closed");
    screen.current?.focus({ preventScroll: true });
    comeIn();
  };

  return (
    <div
      ref={mount}
      tabIndex={-1}
      className={cn(
        "mx-auto flex w-full max-w-[1100px] flex-col outline-none",
        // A Bo3's end holds in the window, the page's margins taken off.
        series ? "h-[calc(100svh-5.5rem)] gap-3.5" : "gap-6",
      )}
    >
      {reached !== null && tierUp === "open" ? (
        <TierUp from={reached.from} to={reached.to} onClose={closeTierUp} />
      ) : null}
      {series ? (
        <DuelEndSeries ending={ending} opponent={opponent} tiles={tiles} beaten={beaten} />
      ) : (
        <>
          <DuelEndOutcome outcome={ending.outcome} forfeit={ending.forfeit} opponent={opponent} />
          <DuelEndScores
            label={m.duel_ended_scores({}, { locale })}
            score={ending.score.score}
            opponentScore={ending.opponentScore.score}
            opponent={opponent}
            record={beaten.has("score")}
          />
          {ending.ranked === null ? null : <DuelEndRank ranked={ending.ranked} />}
          {tiles === null ? null : <DuelEndRecords tiles={tiles} />}
          <DuelEndTape ending={ending} opponent={opponent} beaten={beaten} />
          <DuelEndChart duelId={ending.duelId} />
          <DuelEndActions duelId={ending.duelId} />
        </>
      )}
    </div>
  );
};

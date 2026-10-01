import { DuelEndActions } from "@/components/duel-end/duel-end-actions";
import { DuelEndOutcome } from "@/components/duel-end/duel-end-outcome";
import { DuelEndRank } from "@/components/duel-end/duel-end-rank";
import { DuelEndRecords } from "@/components/duel-end/duel-end-records";
import { DuelEndRounds } from "@/components/duel-end/duel-end-rounds";
import { DuelEndScores } from "@/components/duel-end/duel-end-scores";
import { DuelEndSeriesDuel } from "@/components/duel-end/duel-end-series-duel";
import type { RecordId, RecordTile } from "@/components/duel-end/record-tiles";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelEnding } from "@/stores/duel-store";

type DuelEndSeriesProps = {
  ending: DuelEnding;
  opponent: string;
  tiles: RecordTile[] | null;
  beaten: ReadonlySet<RecordId>;
};

// The end of a Bo3, held in the window without scrolling (a laptop of 1280 × 720 included): its
// outcome, the count of the Rounds in large on the band, then three columns (its Rounds line by
// line and the rank, the Records, the Duel chart or the tale of the tape), and the ways out.
// Under 1024 px of width, two columns (the Rounds and the rank, the Duel), the Records side by side
// under both.
export const DuelEndSeries = ({ ending, opponent, tiles, beaten }: DuelEndSeriesProps) => {
  const locale = useLocale();

  return (
    <>
      <DuelEndOutcome
        outcome={ending.outcome}
        forfeit={ending.forfeit}
        opponent={opponent}
        compact
      />
      <DuelEndScores
        label={m.duel_ended_rounds_won({}, { locale })}
        score={ending.roundsWon}
        opponentScore={ending.opponentRoundsWon}
        opponent={opponent}
        record={false}
        compact
      />
      <div className="grid flex-1 grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1.5fr)] content-start gap-3.5 [grid-template-areas:'rounds_records_duel'] @max-5xl:grid-cols-2 @max-5xl:[grid-template-areas:'rounds_duel'_'records_records']">
        <div className="flex min-w-0 flex-col gap-3.5 [grid-area:rounds]">
          <DuelEndRounds rounds={ending.rounds} opponent={opponent} />
          {ending.ranked === null ? null : <DuelEndRank ranked={ending.ranked} compact />}
        </div>
        <div className="min-w-0 [grid-area:records]">
          {tiles === null ? null : <DuelEndRecords tiles={tiles} compact />}
        </div>
        <DuelEndSeriesDuel ending={ending} opponent={opponent} beaten={beaten} />
      </div>
      <DuelEndActions duelId={ending.duelId} />
    </>
  );
};

import { useState } from "react";

import { DuelEndChart } from "@/components/duel-end/duel-end-chart";
import { DuelEndTape } from "@/components/duel-end/duel-end-tape";
import { type DuelEndView, DuelEndViewPicker } from "@/components/duel-end/duel-end-view-picker";
import type { RecordId } from "@/components/duel-end/record-tiles";
import type { DuelEnding } from "@/stores/duel-store";

type DuelEndSeriesDuelProps = {
  ending: DuelEnding;
  opponent: string;
  beaten: ReadonlySet<RecordId>;
};

// The last column of a Bo3's end: the Duel chart of a Round (the last one first), or the tale of
// the tape of the series, one at a time, so that the screen holds without scrolling.
export const DuelEndSeriesDuel = ({ ending, opponent, beaten }: DuelEndSeriesDuelProps) => {
  const [view, setView] = useState<DuelEndView>("chart");

  return (
    <div className="flex min-w-0 flex-col gap-3 [grid-area:duel]">
      <DuelEndViewPicker view={view} onChange={setView} />
      {view === "chart" ? (
        <DuelEndChart duelId={ending.duelId} compact />
      ) : (
        <DuelEndTape ending={ending} opponent={opponent} beaten={beaten} compact />
      )}
    </div>
  );
};

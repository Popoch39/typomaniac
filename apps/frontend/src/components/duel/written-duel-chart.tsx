import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { duelOnRound, writtenDuelQueryOptions } from "@/api/duel-history";
import { DuelChart } from "@/components/duel-chart/duel-chart";
import { RoundPicker } from "@/components/duel-rounds/round-picker";

// The Duel chart of the Duel just played, read as the Replay reads it, from the same cache: its
// last Round, and in a Bo3 a picker for the others.
export const WrittenDuelChart = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(writtenDuelQueryOptions(duelId));
  const indices = duel.rounds.map(({ index }) => index);
  const [shown, setShown] = useState(() => indices.at(-1) ?? 0);
  const round = duel.rounds.find(({ index }) => index === shown) ?? duel.rounds[0];

  // The API never sends a Duel without a Round (`minItems: 1`).
  if (typeof round === "undefined") {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {indices.length > 1 ? (
        <div className="flex justify-end">
          <RoundPicker rounds={indices} value={shown} onChange={setShown} />
        </div>
      ) : null}
      <DuelChart duel={duelOnRound(duel, round)} />
    </div>
  );
};

import { useSuspenseQuery } from "@tanstack/react-query";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { DuelChart } from "@/components/duel-chart/duel-chart";
import { DuelReplayButton } from "@/components/duel-history/duel-replay-button";
import { DuelResultsTable } from "@/components/duel-history/duel-results-table";

// What the chosen Duel itself tells: its Duel chart, both sides' Results side by side and the way
// to its Replay. It reads the same Duel as the Replay, from the same cache.
export const DuelDetailsBody = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));

  return (
    <>
      <DuelChart duel={duel} />
      <DuelResultsTable duel={duel} />
      <DuelReplayButton duelId={duel.id} />
    </>
  );
};

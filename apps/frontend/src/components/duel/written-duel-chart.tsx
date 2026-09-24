import { useSuspenseQuery } from "@tanstack/react-query";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { DuelChart } from "@/components/duel-chart/duel-chart";

// The Duel chart of the Duel just played, read as the Replay reads it, from the same cache.
export const WrittenDuelChart = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));

  return <DuelChart duel={duel} />;
};

import { useSuspenseQuery } from "@tanstack/react-query";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { DuelChart } from "@/components/duel-chart/duel-chart";
import { ReplayDuelLink } from "@/components/duel/replay-duel-link";
import { ReplayResults } from "@/components/replay/replay-results";

// A Duel of the Duel history opened in place: its Duel chart, both detailed Results and the way to
// its Replay. It reads the same Duel as the Replay, from the same cache.
export const DuelDetails = ({ duelId }: { duelId: string }) => {
  const { data: duel } = useSuspenseQuery(replayedDuelQueryOptions(duelId));

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <DuelChart duel={duel} />
      <ReplayResults duel={duel} />
      <div>
        <ReplayDuelLink duelId={duel.id} />
      </div>
    </div>
  );
};

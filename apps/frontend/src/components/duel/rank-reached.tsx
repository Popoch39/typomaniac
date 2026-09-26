import type { Standing } from "ranked";

import { standingName } from "@/components/tier/tier";

// The rank after a ranked Duel and its TP.
export const RankReached = ({ standing }: { standing: Standing }) => (
  <div className="flex flex-col">
    <p className="text-lg font-bold">{standingName(standing)}</p>
    <p className="font-mono text-sm tabular-nums text-muted-foreground">{`${standing.tp} TP`}</p>
  </div>
);

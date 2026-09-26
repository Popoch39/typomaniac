import { DIVISION_TP, type Standing } from "ranked";

import type { RankChange } from "@/components/duel/rank-change";
import { RankReached } from "@/components/duel/rank-reached";
import { TpBar } from "@/components/duel/tp-bar";
import { TpDelta } from "@/components/duel/tp-delta";
import { standingName } from "@/components/tier/tier";
import { TierBadge } from "@/components/tier/tier-badge";

type TpChangeProps = Extract<RankChange, { kind: "moved" | "promoted" | "demoted" }>;

const headlines = {
  moved: () => null,
  promoted: (standing: Standing) => `Promotion : ${standingName(standing)}`,
  demoted: (standing: Standing) => `Descente en ${standingName(standing)}`,
};

// The TP of a ranked Duel: the delta, the rank after it and its TP, and a promotion or a
// demotion when the Division changed. A Division just left starts the bar from the other end.
// A move up into a new Tier is `TierUp`'s.
export const TpChange = ({ kind, tp, from, standing }: TpChangeProps) => {
  const headline = headlines[kind](standing);
  const before = { moved: from.tp, promoted: 0, demoted: DIVISION_TP }[kind];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <TpDelta tp={tp} />
        <TierBadge standing={standing} size="lg" />
        <div className="flex flex-col">
          {headline === null ? null : <p className="font-semibold text-primary">{headline}</p>}
          <RankReached standing={standing} />
        </div>
      </div>
      {standing.tier === "maniac" ? null : <TpBar before={before} after={standing.tp} />}
    </div>
  );
};

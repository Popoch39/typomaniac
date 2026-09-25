import type { Standing } from "ranked";

import { standingName } from "@/components/tier/tier";
import { TierBadge } from "@/components/tier/tier-badge";

// The last Placement Duel: the rank the MMR reached, revealed.
export const RankRevealed = ({ standing }: { standing: Standing }) => (
  <div className="flex items-center gap-4">
    <TierBadge standing={standing} size="lg" className="motion-safe:animate-tp-pop" />
    <div className="flex flex-col">
      <p className="text-sm text-muted-foreground">Placement terminé, ton rang :</p>
      <p className="text-2xl font-extrabold">{standingName(standing)}</p>
    </div>
  </div>
);

import type { Standing } from "ranked";

import { TierBadge } from "@/components/tier/rank/tier-badge";
import { standingName } from "@/components/tier/tier";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The last Placement Duel: the rank the MMR reached, revealed.
export const RankRevealed = ({ standing }: { standing: Standing }) => {
  const locale = useLocale();

  return (
    <div className="flex items-center gap-4">
      <TierBadge standing={standing} size="lg" className="motion-safe:animate-tp-pop" />
      <div className="flex flex-col">
        <p className="text-sm text-muted-foreground">{m.duel_rank_revealed({}, { locale })}</p>
        <p className="text-2xl font-extrabold">{standingName(standing)}</p>
      </div>
    </div>
  );
};

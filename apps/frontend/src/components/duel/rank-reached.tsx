import type { Standing } from "ranked";

import { standingName } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The rank after a ranked Duel and its TP.
export const RankReached = ({ standing }: { standing: Standing }) => {
  const locale = useLocale();

  return (
    <div className="flex flex-col">
      <p className="text-lg font-bold">{standingName(standing, locale)}</p>
      <p className="font-mono text-sm tabular-nums text-muted-foreground">
        {m.rank_tp({ tp: numberFormat(locale).format(standing.tp) }, { locale })}
      </p>
    </div>
  );
};

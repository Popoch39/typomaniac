import { cn } from "cn";
import type { Standing } from "ranked";

import type { RankHeadline } from "@/components/duel-end/rank-card";
import { standingName } from "@/components/tier/tier";
import type { Locale } from "@/locale/locales";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Over the rank, never its name again: a promotion or the last Placement in the accent, a
// demotion in grey.
const HEADLINES = {
  promotion: { say: (locale: Locale) => m.duel_rank_promotion({}, { locale }), tone: "text-brand" },
  demotion: {
    say: (locale: Locale) => m.duel_rank_demotion({}, { locale }),
    tone: "text-muted-foreground",
  },
  placed: { say: (locale: Locale) => m.duel_rank_placed({}, { locale }), tone: "text-brand" },
};

type DuelEndRankNameProps = {
  standing: Standing;
  headline: RankHeadline | null;
  // In a Bo3's column: smaller, on the line of the Blason and the TP.
  compact?: boolean;
};

// The rank after the Duel and its TP, under its headline when the Duel changed it.
export const DuelEndRankName = ({ standing, headline, compact = false }: DuelEndRankNameProps) => {
  const locale = useLocale();
  const said = headline === null ? null : HEADLINES[headline];

  return (
    <div className={cn("flex shrink-0 flex-col", compact ? "gap-0.5" : "min-w-[220px] gap-1.5")}>
      {said === null ? null : (
        <p
          className={cn("font-display text-[13px] font-bold tracking-[0.1em] uppercase", said.tone)}
        >
          {said.say(locale)}
        </p>
      )}
      <p className={cn("font-extrabold", compact ? "text-xl" : "text-[28px]")}>
        {standingName(standing, locale)}
      </p>
      <p className="font-mono text-sm text-muted-foreground">
        {m.rank_tp({ tp: numberFormat(locale).format(standing.tp) }, { locale })}
      </p>
    </div>
  );
};

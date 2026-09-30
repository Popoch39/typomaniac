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

type DuelEndRankNameProps = { standing: Standing; headline: RankHeadline | null };

// The rank after the Duel and its TP, under its headline when the Duel changed it.
export const DuelEndRankName = ({ standing, headline }: DuelEndRankNameProps) => {
  const locale = useLocale();
  const said = headline === null ? null : HEADLINES[headline];

  return (
    <div className="flex min-w-[220px] shrink-0 flex-col gap-1.5">
      {said === null ? null : (
        <p
          className={cn("font-display text-[13px] font-bold tracking-[0.1em] uppercase", said.tone)}
        >
          {said.say(locale)}
        </p>
      )}
      <p className="text-[28px] font-extrabold">{standingName(standing, locale)}</p>
      <p className="font-mono text-sm text-muted-foreground">
        {m.rank_tp({ tp: numberFormat(locale).format(standing.tp) }, { locale })}
      </p>
    </div>
  );
};

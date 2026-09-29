import { DIVISION_TP, type Standing } from "ranked";

import type { RankChange } from "@/components/duel/rank-change";
import { RankReached } from "@/components/duel/rank-reached";
import { TpBar } from "@/components/duel/tp-bar";
import { TpDelta } from "@/components/duel/tp-delta";
import { TierBadge } from "@/components/tier/rank/tier-badge";
import { standingName } from "@/components/tier/tier";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type TpChangeProps = Extract<RankChange, { kind: "moved" | "promoted" | "demoted" }>;

const headlines = {
  moved: () => null,
  promoted: (standing: Standing, locale: Locale) =>
    m.duel_rank_promoted({ standing: standingName(standing, locale) }, { locale }),
  demoted: (standing: Standing, locale: Locale) =>
    m.duel_rank_demoted({ standing: standingName(standing, locale) }, { locale }),
};

// The TP of a ranked Duel: the delta, the rank after it and its TP, and a promotion or a
// demotion when the Division changed, into a new Tier too. A Division just left starts the bar
// from the other end.
export const TpChange = ({ kind, tp, from, standing }: TpChangeProps) => {
  const locale = useLocale();
  const headline = headlines[kind](standing, locale);
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

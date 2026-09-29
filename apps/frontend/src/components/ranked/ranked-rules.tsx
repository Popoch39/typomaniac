import { DEMOTED_TP, DIVISION_TP, MAX_TP, MIN_TP, PLACEMENT_DUELS } from "ranked";

import { RankedRule } from "@/components/ranked/ranked-rule";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The rules of the Ranked in the Locale, their figures read from the ranked package.
const rulesOf = (locale: Locale) => {
  const numbers = numberFormat(locale);

  return [
    {
      id: "placement",
      term: m.ranked_rule_placement({}, { locale }),
      value: m.ranked_rule_placement_value(
        { count: PLACEMENT_DUELS, shown: numbers.format(PLACEMENT_DUELS) },
        { locale },
      ),
    },
    {
      id: "per-duel",
      term: m.ranked_rule_per_duel({}, { locale }),
      value: m.ranked_rule_per_duel_value(
        { min: numbers.format(MIN_TP), max: numbers.format(MAX_TP) },
        { locale },
      ),
    },
    {
      id: "division",
      term: m.ranked_rule_division({}, { locale }),
      value: m.rank_tp({ tp: numbers.format(DIVISION_TP) }, { locale }),
    },
    {
      id: "below-zero",
      term: m.ranked_rule_below_zero({}, { locale }),
      value: m.ranked_rule_below_zero_value({ tp: numbers.format(DEMOTED_TP) }, { locale }),
    },
    {
      id: "tier-change",
      term: m.ranked_rule_tier_change({}, { locale }),
      value: m.ranked_rule_tier_change_value({}, { locale }),
    },
  ];
};

// How the Tiers are climbed, one rule per line between rules.
export const RankedRules = () => {
  const locale = useLocale();

  return (
    <dl className="flex flex-col border-b border-secondary text-sm">
      {rulesOf(locale).map((rule) => (
        <RankedRule key={rule.id} term={rule.term} value={rule.value} />
      ))}
    </dl>
  );
};

import { DEMOTED_TP, DIVISION_TP, MAX_TP, MIN_TP, PLACEMENT_DUELS } from "ranked";

import { RankedRule } from "@/components/ranked/ranked-rule";

// The rules of the ladder, their figures read from the ranked package.
const RULES = [
  { term: "Placement", value: `${PLACEMENT_DUELS} Duels` },
  { term: "Par Duel", value: `${MIN_TP} à ${MAX_TP} TP` },
  { term: "Une Division", value: `${DIVISION_TP} TP` },
  { term: "Sous 0 TP", value: `${DEMOTED_TP} TP, un cran plus bas` },
  { term: "Changer de Tier", value: "1 Promotion Duel" },
];

// How the ladder is climbed, one rule per line between rules.
export const RankedRules = () => (
  <dl className="flex flex-col border-b border-secondary text-sm">
    {RULES.map((rule) => (
      <RankedRule key={rule.term} term={rule.term} value={rule.value} />
    ))}
  </dl>
);

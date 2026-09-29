import { type OrnamentChoice, type Tier, TIERS } from "ranked";

import { TIER_NAMES } from "@/components/tier/tier";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

export type OrnamentOption = { choice: OrnamentChoice; tier: Tier | null };

// The picker's options, in order: follow the Tier, wear none, then each Tier's Ornament from Iron.
export const ORNAMENT_OPTIONS: readonly OrnamentOption[] = [
  { choice: "follow", tier: null },
  { choice: "none", tier: null },
  ...TIERS.map((tier) => ({ choice: tier, tier })),
];

// An option's name in the Locale: « Suivre mon Tier », « Aucun », or the Tier's, the same in every
// Locale.
export const ornamentOptionLabel = (option: OrnamentOption, locale: Locale) => {
  switch (option.choice) {
    case "follow": {
      return m.ornament_follow({}, { locale });
    }

    case "none": {
      return m.ornament_none({}, { locale });
    }

    default: {
      return TIER_NAMES[option.choice];
    }
  }
};

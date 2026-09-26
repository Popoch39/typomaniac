import { type OrnamentChoice, type Tier, TIERS } from "ranked";

import { TIER_NAMES } from "@/components/tier/tier";

export type OrnamentOption = { choice: OrnamentChoice; label: string; tier: Tier | null };

// The picker's options, in order: follow the Tier, wear none, then each Tier's Ornament from Fer.
export const ORNAMENT_OPTIONS: readonly OrnamentOption[] = [
  { choice: "follow", label: "Suivre mon Tier", tier: null },
  { choice: "none", label: "Aucun", tier: null },
  ...TIERS.map((tier) => ({ choice: tier, label: TIER_NAMES[tier], tier })),
];

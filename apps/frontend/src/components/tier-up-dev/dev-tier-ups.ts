import type { Standing } from "ranked";

// A Tier-up as a Duel would open it: from the top Division of a Tier to the bottom one of the
// next, or into Maniac. The ranks are made up, for the dev page.
export type DevTierUp = { from: Standing; to: Standing };

const top = (tier: Exclude<Standing["tier"], "maniac">): Standing => ({
  tier,
  division: 1,
  tp: 85,
  shielded: false,
});

const bottom = (tier: Exclude<Standing["tier"], "maniac">): Standing => ({
  tier,
  division: 4,
  tp: 13,
  shielded: true,
});

// The six Tier-ups, from Fer → Bronze to Diamant → Maniac.
export const DEV_TIER_UPS: readonly DevTierUp[] = [
  { from: top("fer"), to: bottom("bronze") },
  { from: top("bronze"), to: bottom("argent") },
  { from: top("argent"), to: bottom("or") },
  { from: top("or"), to: bottom("platine") },
  { from: top("platine"), to: bottom("diamant") },
  { from: top("diamant"), to: { tier: "maniac", tp: 10, shielded: true } },
];

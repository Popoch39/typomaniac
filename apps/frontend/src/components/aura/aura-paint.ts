import type { Tier } from "ranked";

// The paint of the light Aura, on the 120 × 120 grid of the Ornaments. Its ids live in the Tier
// sprite, prefixed `tier-` like the rest.

// The Tiers whose Ornament shines: a sheen sweeps their metal now and then.
export const SHINING_TIERS: readonly Tier[] = ["or", "platine", "diamant", "maniac"];

export const shines = (tier: Tier) => SHINING_TIERS.includes(tier);

// How much Aura an Ornament gives off: light in lists, full where it is shown large, and only
// where the caller asks for it.
export type Aura = "light" | "full";

// The Tiers with a full Aura so far, each with its shader (`FULL_AURA_SHADERS` is keyed on them):
// the others stay light, even when asked for a full one.
const FULL_AURA_TIERS = ["or"] as const;

export type FullAuraTier = (typeof FULL_AURA_TIERS)[number];

const FULL: ReadonlySet<Tier> = new Set(FULL_AURA_TIERS);

export const hasFullAura = (tier: Tier): tier is FullAuraTier => FULL.has(tier);

// The white band of the sheen, clear at its edges.
export const SHEEN_ID = "tier-sheen";

// The shape of a Tier's Ornament, which the sheen never leaves.
export const sheenMaskId = (tier: Tier) => `tier-sheen-mask-${tier}`;

// Wide enough for the flames and wings that overflow the grid.
export const SHEEN_MASK_BOX = { x: -30, y: -30, width: 180, height: 180 } as const;

// The band leans, and starts off the Ornament's left edge: masked away until it sweeps, and where
// it stays under reduced motion. It travels right by `SHEEN_TRAVEL`, off the other edge.
export const SHEEN_LEAN = "rotate(20 60 60)";

export const SHEEN_BAND = { x: -72, y: -50, width: 30, height: 220 } as const;

export const SHEEN_TRAVEL = 220;

export const SHEEN_OPACITY = 0.55;

// The sparks of the Diamant and the Maniac, where the drawing leaves room: where, and their size
// unlit. Lit, each grows `SPARK_PEAK` times as large.
type Spark = readonly [x: number, y: number, scale: number];

export const SPARKS: Partial<Record<Tier, readonly Spark[]>> = {
  diamant: [
    [108, 52, 0.28],
    [10, 64, 0.25],
    [84, 112, 0.22],
  ],
  maniac: [
    [104, 12, 0.3],
    [8, 38, 0.25],
    [113, 86, 0.25],
  ],
};

export const SPARK_PEAK = 2;

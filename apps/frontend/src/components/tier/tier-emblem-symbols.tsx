import type { ReactNode } from "react";

import { type Tier, TIERS } from "ranked";

import {
  BEVEL,
  BRIGHT,
  CROWN_FLAME,
  CROWN_FLAME_CORE,
  emblemId,
  ENGRAVED,
  ENGRAVED_LIGHT,
  ENGRAVED_LINE,
  ENGRAVED_LINE_LIGHT,
  FACETS,
  GLINT,
  HOT_ID,
  LIGHT,
  metalId,
  OUTLINES,
  paint,
  ref,
  RIM,
  SPARK_ID,
  STAR_ID,
  STUD,
} from "@/components/tier/tier-sprite-paint";

const SHIELD = "M16 2 L28 6 V15 C28 23 22 28 16 30 C10 28 4 23 4 15 V6 Z";

const SHIELD_LIT = "M16 2 L4 6 V15 C4 23 10 28 16 30 Z";

const SHIELD_BEVEL =
  "M16 5 L25.2 8.1 V15 C25.2 21.3 20.6 25.4 16 27 C11.4 25.4 6.8 21.3 6.8 15 V8.1 Z";

const HEXAGON = "M16 2 L28 9 V23 L16 30 L4 23 V9 Z";

const GEM = "M9 4 H23 L30 12 L16 30 L2 12 Z";

const CROWN = "M3 11 L10 17.5 L13 12.5 L16 16 L19 12.5 L22 17.5 L29 11 L26 25 H6 Z";

const CROWN_BAND = "M6 26.5 H26 V29.5 H6 Z";

// A piece of a Tier's metal: its outline, its metal, then its lit half.
const metalPiece = (tier: Tier, d: string, lit: string) => (
  <>
    <path d={d} fill={OUTLINES[tier]} stroke={OUTLINES[tier]} {...RIM} />
    <path d={d} fill={paint(metalId(tier))} />
    <path d={lit} {...LIGHT} />
  </>
);

// The shield of Fer to Or, placed on the 120 grid, its engraving over it.
const shield = (tier: Tier, transform: string, engraving: ReactNode) => (
  <g transform={transform}>
    {metalPiece(tier, SHIELD, SHIELD_LIT)}
    <path d={SHIELD_BEVEL} {...BEVEL} />
    {engraving}
  </g>
);

// Chevrons cut in the metal, the light on their lower lip.
const chevrons = (d: string) => (
  <>
    <path d={d} {...ENGRAVED_LINE_LIGHT} transform="translate(0 0.7)" />
    <path d={d} {...ENGRAVED_LINE} />
  </>
);

// A star cut in the metal, the light on its lower lip.
const engravedStar = (lift: number) => (
  <>
    <use href={ref(STAR_ID)} {...ENGRAVED_LIGHT} transform={`translate(0 ${lift + 0.7})`} />
    <use href={ref(STAR_ID)} {...ENGRAVED} transform={`translate(0 ${lift})`} />
  </>
);

// A gem of fire set in the Maniac's crown.
const ember = (cx: number, radius: number) => (
  <>
    <circle cx={cx} cy={21} r={radius + 0.6} {...ENGRAVED} />
    <circle cx={cx} cy={21} r={radius} fill={paint(HOT_ID)} />
  </>
);

// The Emblem of each Tier on the 120 × 120 grid of the mock-up, bigger at each Tier.
const EMBLEM_DRAWINGS: Record<Tier, ReactNode> = {
  fer: shield(
    "fer",
    "translate(36 34) scale(1.5)",
    <>
      <circle cx={16} cy={15.5} r={3.4} {...ENGRAVED} />
      <circle cx={16} cy={15.5} r={2.3} fill={paint(metalId("fer"))} />
      <circle cx={15.3} cy={14.7} r={0.8} {...BRIGHT} />
    </>,
  ),
  bronze: shield(
    "bronze",
    "translate(35.2 33.2) scale(1.55)",
    chevrons("M10.5 13 L16 18 L21.5 13"),
  ),
  argent: shield(
    "argent",
    "translate(34.4 32.4) scale(1.6)",
    chevrons("M10.5 10 L16 15 L21.5 10 M10.5 16 L16 21 L21.5 16"),
  ),
  or: shield(
    "or",
    "translate(33.6 31.6) scale(1.65)",
    <>
      {engravedStar(0)}
      <circle cx={16} cy={3.6} r={1} {...STUD} />
    </>,
  ),
  platine: (
    <g transform="translate(32.5 30.5) scale(1.72)">
      {metalPiece("platine", HEXAGON, "M16 2 L4 9 V23 L16 30 Z")}
      <path d="M16 5.5 L25 10.7 V21.3 L16 26.5 L7 21.3 V10.7 Z" {...BEVEL} />
      {engravedStar(0.6)}
      <circle cx={16} cy={2.6} r={1.1} {...STUD} />
      <circle cx={27.4} cy={9.3} r={1.1} {...STUD} />
      <circle cx={27.4} cy={22.7} r={1.1} {...STUD} />
      <circle cx={16} cy={29.4} r={1.1} {...STUD} />
      <circle cx={4.6} cy={22.7} r={1.1} {...STUD} />
      <circle cx={4.6} cy={9.3} r={1.1} {...STUD} />
    </g>
  ),
  diamant: (
    <g transform="translate(31.5 29.5) scale(1.78)">
      <path d={GEM} fill={OUTLINES.diamant} stroke={OUTLINES.diamant} {...RIM} />
      <path d={GEM} fill={paint(metalId("diamant"))} />
      <path d="M9 4 L12 12 L2 12 Z" {...BRIGHT} />
      <path d="M9 4 L16 4 L12 12 Z" {...LIGHT} />
      <path d="M2 12 L12 12 L16 30 Z" {...LIGHT} />
      <path d="M23 4 L30 12 L20 12 Z" {...ENGRAVED} opacity={0.25} />
      <path d="M20 12 L30 12 L16 30 Z" {...ENGRAVED} opacity={0.25} />
      <path d="M2 12 H30 M9 4 L12 12 L16 30 L20 12 L23 4 M12 12 L16 4 L20 12" {...FACETS} />
      <circle cx={9} cy={4} r={1.1} {...STUD} />
      <circle cx={23} cy={4} r={1.1} {...STUD} />
      <circle cx={2} cy={12} r={1.1} {...STUD} />
      <circle cx={30} cy={12} r={1.1} {...STUD} />
      <use href={ref(SPARK_ID)} {...GLINT} transform="translate(9.5 8) scale(0.5)" />
    </g>
  ),
  maniac: (
    <g transform="translate(30.4 28.4) scale(1.85)">
      <path d={CROWN} fill={OUTLINES.maniac} stroke={OUTLINES.maniac} {...RIM} />
      <path d={CROWN_BAND} fill={OUTLINES.maniac} stroke={OUTLINES.maniac} {...RIM} />
      <path d={CROWN} fill={paint(metalId("maniac"))} />
      <path d="M3 11 L10 17.5 L13 12.5 L16 16 V25 H6 Z" {...LIGHT} />
      <path d={CROWN_BAND} fill={paint(metalId("maniac"))} />
      <path d="M6.6 27.1 H25.4" {...BEVEL} />
      {ember(11, 1.3)}
      {ember(16, 1.5)}
      {ember(21, 1.3)}
      <circle cx={3} cy={11} r={1.7} fill={paint(HOT_ID)} />
      <circle cx={29} cy={11} r={1.7} fill={paint(HOT_ID)} />
      <path d={CROWN_FLAME} fill={paint(HOT_ID)} />
      <path d={CROWN_FLAME_CORE} {...BRIGHT} />
    </g>
  ),
};

// One symbol per Tier's Emblem, for the sprite.
export const TierEmblemSymbols = () =>
  TIERS.map((tier) => (
    <symbol key={tier} id={emblemId(tier)} viewBox="0 0 120 120">
      {EMBLEM_DRAWINGS[tier]}
    </symbol>
  ));

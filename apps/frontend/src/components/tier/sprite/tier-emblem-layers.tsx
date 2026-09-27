import type { ReactNode } from "react";

import type { Tier } from "ranked";

import {
  BEVEL,
  BRIGHT,
  CROWN_FLAME,
  CROWN_FLAME_CORE,
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
} from "@/components/tier/sprite/tier-sprite-paint";
import {
  CROWN,
  CROWN_BAND,
  GEM,
  HEXAGON,
  SHIELD,
} from "@/components/tier/sprite/tier-emblem-outline";

const SHIELD_LIT = "M16 2 L4 6 V15 C4 23 10 28 16 30 Z";

const SHIELD_BEVEL =
  "M16 5 L25.2 8.1 V15 C25.2 21.3 20.6 25.4 16 27 C11.4 25.4 6.8 21.3 6.8 15 V8.1 Z";

// A piece of a Tier's metal: its outline, its metal, then its lit half.
const metalPiece = (tier: Tier, d: string, lit: string) => (
  <>
    <path d={d} fill={OUTLINES[tier]} stroke={OUTLINES[tier]} {...RIM} />
    <path d={d} fill={paint(metalId(tier))} />
    <path d={lit} {...LIGHT} />
  </>
);

// An Emblem in two layers, on its 32 × 32 grid: its body of metal, then what is cut or set in it.
// The sprite draws both at once; the Tier-up brings them in one after the other.
export type EmblemLayers = { body: ReactNode; engraving: ReactNode };

// The shield of Fer to Or.
const shield = (tier: Tier, engraving: ReactNode): EmblemLayers => ({
  body: (
    <>
      {metalPiece(tier, SHIELD, SHIELD_LIT)}
      <path d={SHIELD_BEVEL} {...BEVEL} />
    </>
  ),
  engraving,
});

// A chevron cut in the metal, the light on its lower lip: a group of its own, that the Tier-up
// can stamp on its own.
const chevron = (d: string) => (
  <g>
    <path d={d} {...ENGRAVED_LINE_LIGHT} transform="translate(0 0.7)" />
    <path d={d} {...ENGRAVED_LINE} />
  </g>
);

// A star cut in the metal, in the dark of the Tier's own outline as the mock-ups draw it, the light
// on its lower lip: a group of its own, that the Tier-up can bring in whole without touching the
// opacity of its layers.
const engravedStar = (tier: Tier, lift: number) => (
  <g>
    <use href={ref(STAR_ID)} {...ENGRAVED_LIGHT} transform={`translate(0 ${lift + 0.7})`} />
    <use
      href={ref(STAR_ID)}
      fill={OUTLINES[tier]}
      opacity={0.75}
      transform={`translate(0 ${lift})`}
    />
  </g>
);

// A gem of fire set in the Maniac's crown.
const ember = (cx: number, radius: number) => (
  <>
    <circle cx={cx} cy={21} r={radius + 0.6} {...ENGRAVED} />
    <circle cx={cx} cy={21} r={radius} fill={paint(HOT_ID)} />
  </>
);

// The studs set at the corners of the Platine, from its top round: the Tier-up pops them in one
// by one.
export const PLATINE_STUDS = [
  [16, 2.6],
  [27.4, 9.3],
  [27.4, 22.7],
  [16, 29.4],
  [4.6, 22.7],
  [4.6, 9.3],
] as const;

// The Emblem of each Tier, on its own grid: placed on the 120 × 120 grid of the mock-up by
// `EMBLEM_OUTLINES`, bigger at each Tier.
export const EMBLEM_LAYERS: Record<Tier, EmblemLayers> = {
  fer: shield(
    "fer",
    <>
      <circle cx={16} cy={15.5} r={3.4} {...ENGRAVED} />
      <circle cx={16} cy={15.5} r={2.3} fill={paint(metalId("fer"))} />
      <circle cx={15.3} cy={14.7} r={0.8} {...BRIGHT} />
    </>,
  ),
  bronze: shield("bronze", chevron("M10.5 13 L16 18 L21.5 13")),
  argent: shield(
    "argent",
    <>
      {chevron("M10.5 10 L16 15 L21.5 10")}
      {chevron("M10.5 16 L16 21 L21.5 16")}
    </>,
  ),
  or: shield(
    "or",
    <>
      {engravedStar("or", 0)}
      <circle cx={16} cy={3.6} r={1} {...STUD} />
    </>,
  ),
  platine: {
    body: (
      <>
        {metalPiece("platine", HEXAGON, "M16 2 L4 9 V23 L16 30 Z")}
        <path d="M16 5.5 L25 10.7 V21.3 L16 26.5 L7 21.3 V10.7 Z" {...BEVEL} />
      </>
    ),
    engraving: (
      <>
        {engravedStar("platine", 0.6)}
        {PLATINE_STUDS.map(([cx, cy]) => (
          <circle key={`${cx} ${cy}`} cx={cx} cy={cy} r={1.1} {...STUD} />
        ))}
      </>
    ),
  },
  diamant: {
    body: (
      <>
        <path d={GEM} fill={OUTLINES.diamant} stroke={OUTLINES.diamant} {...RIM} />
        <path d={GEM} fill={paint(metalId("diamant"))} />
        <path d="M9 4 L12 12 L2 12 Z" {...BRIGHT} />
        <path d="M9 4 L16 4 L12 12 Z" {...LIGHT} />
        <path d="M2 12 L12 12 L16 30 Z" {...LIGHT} />
        <path d="M23 4 L30 12 L20 12 Z" {...ENGRAVED} opacity={0.25} />
        <path d="M20 12 L30 12 L16 30 Z" {...ENGRAVED} opacity={0.25} />
      </>
    ),
    engraving: (
      <>
        <path d="M2 12 H30 M9 4 L12 12 L16 30 L20 12 L23 4 M12 12 L16 4 L20 12" {...FACETS} />
        <circle cx={9} cy={4} r={1.1} {...STUD} />
        <circle cx={23} cy={4} r={1.1} {...STUD} />
        <circle cx={2} cy={12} r={1.1} {...STUD} />
        <circle cx={30} cy={12} r={1.1} {...STUD} />
        <use href={ref(SPARK_ID)} {...GLINT} transform="translate(9.5 8) scale(0.5)" />
      </>
    ),
  },
  maniac: {
    body: (
      <>
        <path d={CROWN} fill={OUTLINES.maniac} stroke={OUTLINES.maniac} {...RIM} />
        <path d={CROWN_BAND} fill={OUTLINES.maniac} stroke={OUTLINES.maniac} {...RIM} />
        <path d={CROWN} fill={paint(metalId("maniac"))} />
        <path d="M3 11 L10 17.5 L13 12.5 L16 16 V25 H6 Z" {...LIGHT} />
        <path d={CROWN_BAND} fill={paint(metalId("maniac"))} />
        <path d="M6.6 27.1 H25.4" {...BEVEL} />
      </>
    ),
    engraving: (
      <>
        {ember(11, 1.3)}
        {ember(16, 1.5)}
        {ember(21, 1.3)}
        <circle cx={3} cy={11} r={1.7} fill={paint(HOT_ID)} />
        <circle cx={29} cy={11} r={1.7} fill={paint(HOT_ID)} />
        <path d={CROWN_FLAME} fill={paint(HOT_ID)} />
        <path d={CROWN_FLAME_CORE} {...BRIGHT} />
      </>
    ),
  },
};

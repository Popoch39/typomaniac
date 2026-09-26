import type { ReactNode } from "react";

import { type Tier, TIERS } from "ranked";

import {
  BAND,
  BAND_OUTLINE,
  BANNER_BEVEL,
  BEADS,
  BRIGHT,
  CROWN_FLAME,
  CROWN_FLAME_CORE,
  deepId,
  FEATHER_ID,
  FLAME_ID,
  GLINT,
  glowId,
  HOT_ID,
  LEAF_ID,
  LINE,
  metalId,
  ornamentId,
  OUTLINES,
  paint,
  PLATES,
  RAYS,
  ref,
  RIM,
  SPARK_ID,
  STAR_EDGE,
  STAR_ID,
  STEM,
  STUD,
} from "@/components/tier/tier-sprite-paint";

// The pieces an Ornament draws on its left, mirrored on its right.
const laurelId = (tier: Tier) => `tier-laurel-${tier}`;

const wingId = (tier: Tier) => `tier-wing-${tier}`;

const bannerId = (tier: Tier) => `tier-banner-${tier}`;

// The leaves of a laurel, up from the bottom: where, and turned how far.
const LEAVES = [
  [43.9, 104.2, 80],
  [28.6, 94.9, 102],
  [17.8, 80.6, 124],
  [13.1, 63.3, 146],
  [15.3, 45.5, 168],
  [24, 29.8, 190],
  [38, 18.5, 212],
] as const;

// The smaller leaves behind, in deep metal.
const BACK_LEAVES = [
  [39.4, 94.3, 151],
  [21.4, 70.4, 195],
  [25, 40.6, 239],
] as const;

// Each laurel: where its stem ends, how many leaves it has in front and behind.
const LAURELS: readonly { tier: Tier; stemEnd: string; leaves: number; backLeaves: number }[] = [
  { tier: "bronze", stemEnd: "19.2 76.5", leaves: 3, backLeaves: 0 },
  { tier: "argent", stemEnd: "19.2 43.5", leaves: 5, backLeaves: 0 },
  { tier: "or", stemEnd: "42.1 19.8", leaves: 7, backLeaves: 3 },
  { tier: "platine", stemEnd: "16.1 67.7", leaves: 4, backLeaves: 2 },
];

const leaf = (fill: string, [x, y, turn]: readonly [number, number, number], scale?: number) => (
  <use
    key={`${x} ${y}`}
    href={ref(LEAF_ID)}
    fill={fill}
    {...LINE}
    transform={`translate(${x} ${y}) rotate(${turn})${scale === undefined ? "" : ` scale(${scale})`}`}
  />
);

// Feathers fanned from the wing's root: how far each turns, and its size.
const feathers = (fill: string, fan: readonly (readonly [number, number])[]) =>
  fan.map(([turn, scale]) => (
    <use
      key={turn}
      href={ref(FEATHER_ID)}
      fill={fill}
      {...LINE}
      transform={`rotate(${turn}) scale(${scale})`}
    />
  ));

const WINGS: Partial<Record<Tier, ReactNode>> = {
  platine: (
    <g transform="translate(46 56)">
      {feathers(paint(metalId("platine")), [
        [48, 0.85],
        [28, 1],
        [8, 0.9],
      ])}
    </g>
  ),
  diamant: (
    <>
      <path
        d="M45 6 L49.5 17 L45 31 L40.5 17 Z"
        fill={paint(metalId("diamant"))}
        {...LINE}
        transform="rotate(-18 45 19)"
      />
      <path d="M45 6 L45 31 L40.5 17 Z" {...BRIGHT} transform="rotate(-18 45 19)" />
      <g transform="translate(46 56)">
        {feathers(paint(deepId("diamant")), [
          [60, 0.8],
          [38, 1],
          [16, 1.1],
          [-6, 0.95],
        ])}
        {feathers(paint(metalId("diamant")), [
          [45, 0.66],
          [22, 0.76],
          [0, 0.72],
        ])}
      </g>
    </>
  ),
  maniac: (
    <>
      <g transform="translate(46 56)">
        {feathers(paint(deepId("maniac")), [
          [70, 0.75],
          [48, 0.95],
          [26, 1.12],
          [4, 1.1],
          [-18, 0.9],
        ])}
        {feathers(paint(HOT_ID), [
          [50, 0.66],
          [27, 0.78],
          [4, 0.74],
        ])}
      </g>
      <use href={ref(SPARK_ID)} fill={paint(HOT_ID)} transform="translate(12 26) scale(0.5)" />
      <circle cx={22} cy={14} r={1.5} fill={paint(HOT_ID)} />
      <circle cx={3} cy={70} r={1.3} fill={paint(HOT_ID)} />
    </>
  ),
};

// The banner across the bottom: its two tails, its body, and what it carries.
const banner = (tier: Tier, tails: [string, string], body: string, bevel: string) => (
  <>
    <path d={tails[0]} fill={paint(deepId(tier))} {...LINE} />
    <path d={tails[1]} fill={paint(deepId(tier))} {...LINE} />
    <path d={body} fill={paint(metalId(tier))} {...LINE} />
    <path d={bevel} {...BANNER_BEVEL} />
  </>
);

const PLAIN_BANNER_TAILS: [string, string] = [
  "M28 99 H46 V111 H28 L33.5 105 Z",
  "M92 99 H74 V111 H92 L86.5 105 Z",
];

const PLAIN_BANNER = "M38 95 Q60 90 82 95 V107 Q60 102 38 107 Z";

const PLAIN_BANNER_BEVEL = "M40 97 Q60 92.4 80 97";

const BANNERS: Partial<Record<Tier, ReactNode>> = {
  argent: banner("argent", PLAIN_BANNER_TAILS, PLAIN_BANNER, PLAIN_BANNER_BEVEL),
  or: banner("or", PLAIN_BANNER_TAILS, PLAIN_BANNER, PLAIN_BANNER_BEVEL),
  platine: (
    <>
      {banner(
        "platine",
        ["M26 99 H46 V111 H26 L32 105 Z", "M94 99 H74 V111 H94 L88 105 Z"],
        "M36 95 Q60 89.5 84 95 V107 Q60 101.5 36 107 Z",
        "M38 97 Q60 92 82 97",
      )}
      <circle cx={42} cy={100.4} r={1.4} {...STUD} />
      <circle cx={78} cy={100.4} r={1.4} {...STUD} />
    </>
  ),
  diamant: (
    <>
      {banner(
        "diamant",
        ["M24 99 H46 V111 H24 L30.5 105 Z", "M96 99 H74 V111 H96 L89.5 105 Z"],
        "M34 95 Q60 89 86 95 V107 Q60 101 34 107 Z",
        "M36 97 Q60 91.6 84 97",
      )}
      <path d="M60 93.5 L65 99.5 L60 106.5 L55 99.5 Z" fill={paint(metalId("diamant"))} {...LINE} />
      <path d="M60 93.5 L60 106.5 L55 99.5 Z" {...BRIGHT} />
    </>
  ),
  maniac: (
    <>
      {banner(
        "maniac",
        ["M22 99 H46 V111 H22 L29 105 Z", "M98 99 H74 V111 H98 L91 105 Z"],
        "M32 95 Q60 88.5 88 95 V107 Q60 100.5 32 107 Z",
        "M34 97 Q60 91.2 86 97",
      )}
      <circle cx={60} cy={99.8} r={3} fill={paint(HOT_ID)} {...LINE} />
      <circle cx={46} cy={100.8} r={1.4} fill={paint(HOT_ID)} />
      <circle cx={74} cy={100.8} r={1.4} fill={paint(HOT_ID)} />
    </>
  ),
};

// A piece drawn on the left, then mirrored on the right.
const bothSides = (id: string) => (
  <>
    <use href={ref(id)} width="120" height="120" />
    <use href={ref(id)} width="120" height="120" transform="translate(120 0) scale(-1 1)" />
  </>
);

const glow = (tier: Tier, radius: number) => (
  <circle cx={60} cy={60} r={radius} fill={paint(glowId(tier))} />
);

// The riveted ring every Ornament from Fer to Or starts from.
const ring = (tier: Tier) => (
  <>
    <circle cx={60} cy={60} r={46} {...BAND_OUTLINE} stroke={OUTLINES[tier]} />
    <circle cx={60} cy={60} r={46} {...BAND} stroke={paint(metalId(tier))} />
  </>
);

const rivet = (tier: Tier, cx: number, cy: number, radius = 3.4) => (
  <circle cx={cx} cy={cy} r={radius} fill={paint(metalId(tier))} {...LINE} />
);

const HEXAGON_PLATE = "M60 6 L106.8 33 V87 L60 114 L13.2 87 V33 Z";

const STAR_PLATE =
  "M60 2 L76.8 19.3 L101 19 L100.7 43.2 L118 60 L100.7 76.8 L101 101 L76.8 100.7 L60 118 L43.2 100.7 L19 101 L19.3 76.8 L2 60 L19.3 43.2 L19 19 L43.2 19.3 Z";

const HEXAGON_GEM = "M60 0.5 L68.2 5.25 V14.75 L60 19.5 L51.8 14.75 V5.25 Z";

const CRYSTAL = "M60 0 L66.5 13 L60 30 L53.5 13 Z";

// The flames around the Maniac's brazier: where, turned how far, and their size.
const FLAMES = [
  [11.7, 47.1, -75, 1.05],
  [24.6, 24.6, -45, 1.2],
  [47.1, 11.7, -15, 1.1],
  [72.9, 11.7, 15, 1.1],
  [95.4, 24.6, 45, 1.2],
  [108.3, 47.1, 75, 1.05],
] as const;

// The Ornament of each Tier on the 120 × 120 grid, richer at each Tier: each keeps the pieces of
// the one before it and adds its own.
const ORNAMENT_DRAWINGS: Record<Tier, ReactNode> = {
  fer: (
    <>
      {ring("fer")}
      {rivet("fer", 106, 60)}
      {rivet("fer", 14, 60)}
      {rivet("fer", 60, 14)}
      {rivet("fer", 60, 106)}
    </>
  ),
  bronze: (
    <>
      {ring("bronze")}
      {rivet("bronze", 60, 14)}
      {bothSides(laurelId("bronze"))}
      {rivet("bronze", 60, 104, 4.2)}
    </>
  ),
  argent: (
    <>
      {ring("argent")}
      {rivet("argent", 60, 14)}
      {bothSides(laurelId("argent"))}
      <use href={ref(bannerId("argent"))} width="120" height="120" />
    </>
  ),
  or: (
    <>
      {glow("or", 60)}
      {ring("or")}
      <circle cx={60} cy={60} r={41.2} {...BEADS} />
      {bothSides(laurelId("or"))}
      <use href={ref(bannerId("or"))} width="120" height="120" />
      <use
        href={ref(STAR_ID)}
        fill={paint(metalId("or"))}
        {...LINE}
        transform="translate(46.4 0.9) scale(0.85)"
      />
    </>
  ),
  platine: (
    <>
      {glow("platine", 60)}
      <path d={HEXAGON_PLATE} {...PLATES.platine} />
      <path d={HEXAGON_PLATE} {...BAND_OUTLINE} stroke={OUTLINES.platine} strokeLinejoin="round" />
      <path d={HEXAGON_PLATE} {...BAND} stroke={paint(metalId("platine"))} strokeLinejoin="round" />
      <circle cx={106.8} cy={33} r={2.4} {...STUD} />
      <circle cx={106.8} cy={87} r={2.4} {...STUD} />
      <circle cx={13.2} cy={87} r={2.4} {...STUD} />
      <circle cx={13.2} cy={33} r={2.4} {...STUD} />
      {bothSides(wingId("platine"))}
      {bothSides(laurelId("platine"))}
      <use href={ref(bannerId("platine"))} width="120" height="120" />
      <path d={HEXAGON_GEM} fill={OUTLINES.platine} stroke={OUTLINES.platine} {...RIM} />
      <path d={HEXAGON_GEM} fill={paint(metalId("platine"))} />
      <path d="M60 0.5 L60 19.5 L51.8 14.75 V5.25 Z" {...BRIGHT} />
      <use href={ref(SPARK_ID)} {...GLINT} transform="translate(56 6) scale(0.4)" />
    </>
  ),
  diamant: (
    <>
      {glow("diamant", 62)}
      <path d={STAR_PLATE} {...PLATES.diamant} />
      <path d={STAR_PLATE} {...STAR_EDGE} stroke={paint(metalId("diamant"))} />
      {bothSides(wingId("diamant"))}
      <use href={ref(bannerId("diamant"))} width="120" height="120" />
      <path d={CRYSTAL} fill={OUTLINES.diamant} stroke={OUTLINES.diamant} {...RIM} />
      <path d={CRYSTAL} fill={paint(metalId("diamant"))} />
      <path d="M60 0 L60 30 L53.5 13 Z" {...BRIGHT} />
      <use href={ref(SPARK_ID)} {...GLINT} transform="translate(99 16) scale(0.7)" />
      <use href={ref(SPARK_ID)} {...GLINT} transform="translate(16 94) scale(0.5)" />
    </>
  ),
  maniac: (
    <>
      {glow("maniac", 66)}
      <circle cx={60} cy={60} r={40} {...RAYS} stroke={paint(metalId("maniac"))} />
      {FLAMES.map(([x, y, turn, scale]) => (
        <use
          key={turn}
          href={ref(FLAME_ID)}
          fill={paint(HOT_ID)}
          transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale})`}
        />
      ))}
      {bothSides(wingId("maniac"))}
      <use href={ref(bannerId("maniac"))} width="120" height="120" />
      <path
        d={CROWN_FLAME}
        fill={paint(HOT_ID)}
        {...LINE}
        transform="translate(34.4 1) scale(1.6)"
      />
      <path d={CROWN_FLAME_CORE} {...BRIGHT} transform="translate(34.4 1) scale(1.6)" />
    </>
  ),
};

// The pieces as symbols of their own, then one symbol per Tier's Ornament, for the sprite.
export const TierOrnamentSymbols = () => (
  <>
    {LAURELS.map(({ tier, stemEnd, leaves, backLeaves }) => (
      <symbol key={tier} id={laurelId(tier)} viewBox="0 0 120 120">
        <path d={`M52.3 103.3 A44 44 0 0 1 ${stemEnd}`} {...STEM} stroke={OUTLINES[tier]} />
        {BACK_LEAVES.slice(0, backLeaves).map((place) => leaf(paint(deepId(tier)), place, 0.75))}
        {LEAVES.slice(0, leaves).map((place) => leaf(paint(metalId(tier)), place))}
      </symbol>
    ))}
    {TIERS.map((tier) =>
      WINGS[tier] === undefined ? null : (
        <symbol key={tier} id={wingId(tier)} viewBox="0 0 120 120">
          {WINGS[tier]}
        </symbol>
      ),
    )}
    {TIERS.map((tier) =>
      BANNERS[tier] === undefined ? null : (
        <symbol key={tier} id={bannerId(tier)} viewBox="0 0 120 120">
          {BANNERS[tier]}
        </symbol>
      ),
    )}
    {TIERS.map((tier) => (
      <symbol key={tier} id={ornamentId(tier)} viewBox="0 0 120 120">
        {ORNAMENT_DRAWINGS[tier]}
      </symbol>
    ))}
  </>
);

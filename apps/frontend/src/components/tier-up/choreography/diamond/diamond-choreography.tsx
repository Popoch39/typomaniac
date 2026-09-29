import {
  DIAMOND_FACETS,
  FACET_S,
  FACET_STEP_S,
  FACETS_AT,
} from "@/components/tier-up/choreography/diamond/diamond-facets";
import {
  DIAMOND_GLASS,
  DIAMOND_SPARKS,
  DIAMOND_STREAKS,
  DIAMOND_TWINKLES,
} from "@/components/tier-up/choreography/diamond/diamond-lights";
import { TierUpCutEmblem } from "@/components/tier-up/choreography/diamond/tier-up-cut-emblem";
import { TierUpDiamondHalo } from "@/components/tier-up/choreography/diamond/tier-up-diamond-halo";
import { TierUpDiamondRays } from "@/components/tier-up/choreography/diamond/tier-up-diamond-rays";
import { TierUpGlare } from "@/components/tier-up/choreography/diamond/tier-up-glare";
import { TierUpGlass } from "@/components/tier-up/choreography/diamond/tier-up-glass";
import { TierUpImplosion } from "@/components/tier-up/choreography/diamond/tier-up-implosion";
import { TierUpShade } from "@/components/tier-up/choreography/diamond/tier-up-shade";
import { TierUpTwinkles } from "@/components/tier-up/choreography/diamond/tier-up-twinkles";
import type { Choreography } from "@/components/tier-up/choreography/tier-up-choreography";
import {
  CONVERGE,
  EASE_IN_OUT,
  EASE_OUT,
  FACET,
  FAN_OUT,
  IMPLODE,
  LAND,
  RING,
  SLAM,
  STUD_POP,
} from "@/components/tier-up/choreography/tier-up-eases";
import {
  breathe,
  captionLinesIn,
  DRAWN,
  flash,
  popIn,
  ringOut,
  shakeThrough,
  sparksOut,
  UNDRAWN,
} from "@/components/tier-up/choreography/tier-up-moves";
import { part } from "@/components/tier-up/choreography/tier-up-part";
import { TierUpGround } from "@/components/tier-up/parts/tier-up-ground";
import { TierUpOldEmblem } from "@/components/tier-up/parts/tier-up-old-emblem";
import { PRISM } from "@/components/tier-up/parts/tier-up-paint";
import { TierUpSparks } from "@/components/tier-up/parts/tier-up-sparks";
import { DIAMOND_FANS } from "@/components/tier/sprite/tier-wing-fans";

type Timeline = gsap.core.Timeline;

// When the gem slams down.
const IMPACT = 3.8;

// The screen shaking as the gem slams down, over 0.55 s: through each x, y (px) at its share of
// it, dying down, then still again.
const SHAKE = [
  [0.1, -20, 12],
  [0.2, 18, -14],
  [0.3, -14, -9],
  [0.4, 12, 10],
  [0.52, -8, 6],
  [0.64, 6, -5],
  [0.76, -3, 3],
  [0.88, 2, -1],
] as const;

const SHAKE_S = 0.55;

// The stage darkening around the Platinum from 0.1 s, for 3.8 s: dark at 20 % of it, clearing from
// 85 %.
const VIGNETTE = { at: 0.1, duration: 3.8, dark: 0.2, clearing: 0.85 } as const;

// The heart of light, from 1.35 s, for 2.45 s: whole at 15 % of it, then growing to 2.8 times its
// size by 88 %, then gone at the impact.
const CORE = { at: 1.35, duration: 2.45, lit: 0.15, grown: 0.88, size: 2.8 } as const;

// The cut traced in light, then fading once the gem has slammed down.
const CUT_AT = 3.3;

// When the deep feathers and the metal ones start to unfurl, the topmost of each first, then
// seconds between a feather and the one below it.
const FANS_AT = { deep: 3.84, metal: 4 } as const;

const FEATHER_STEP_S = 0.05;

// How a feather starts to unfurl: turned back and tiny.
const FURLED = { "--turn": -14, "--grow": 0.1, opacity: 0 };

// When the wings start fluttering and how far they flap (deg), every 2.6 s.
const FLUTTER = { at: 4.8, flap: -5, period: 2.6 } as const;

// When the glint on the gem twinkles, every 1.6 s, and how far it turns as it does (deg); the
// stars around, every 1.9 s.
const GLINT = { at: 4.8, period: 1.6, spin: 45 } as const;

const TWINKLE_S = 1.9;

// How far each ghost of the name slides in from (px).
const GHOSTS = { left: -44, right: 44 } as const;

// The Platinum sucked into itself, turning and brighter, while the stage darkens around it; the
// streaks of light rushing in, each along its line; the heart of light they feed.
const implodes = (timeline: Timeline) => {
  timeline
    .fromTo(part("old"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: EASE_OUT }, 0.1)
    .fromTo(
      part("old-dissolve"),
      { scale: 1, rotation: 0, opacity: 1, filter: "brightness(1)" },
      {
        scale: 0,
        rotation: 200,
        opacity: 0.6,
        filter: "brightness(4)",
        duration: 0.7,
        ease: IMPLODE,
      },
      "dissolve",
    )
    .fromTo(
      part("vignette"),
      { opacity: 0 },
      {
        keyframes: [
          { opacity: 1, duration: VIGNETTE.duration * VIGNETTE.dark, ease: EASE_IN_OUT },
          { opacity: 1, duration: VIGNETTE.duration * (VIGNETTE.clearing - VIGNETTE.dark) },
          { opacity: 0, duration: VIGNETTE.duration * (1 - VIGNETTE.clearing), ease: EASE_IN_OUT },
        ],
      },
      VIGNETTE.at,
    )
    .fromTo(
      part("core"),
      { scale: 0, opacity: 0 },
      {
        keyframes: [
          { scale: 1, opacity: 1, duration: CORE.duration * CORE.lit },
          { scale: CORE.size, duration: CORE.duration * (CORE.grown - CORE.lit) },
          { scale: 0, opacity: 0, duration: CORE.duration * (1 - CORE.grown) },
        ],
      },
      CORE.at,
    );

  for (const [index, { reach, delay, duration }] of DIAMOND_STREAKS.entries()) {
    const streak = `${part("streak")}[data-index="${index}"]`;

    timeline
      .fromTo(
        streak,
        { x: reach, scaleX: 1 },
        { x: 0, scaleX: 0.2, duration, ease: CONVERGE },
        delay,
      )
      .fromTo(
        streak,
        { opacity: 0 },
        {
          keyframes: [
            { opacity: 1, duration: duration * 0.25, ease: CONVERGE },
            { opacity: 0, duration: duration * 0.75, ease: CONVERGE },
          ],
        },
        delay,
      );
  }
};

// Each facet flying in from far off, turned in depth, lit from a third of its flight: all in
// place before the cut is traced.
const facetsMeet = (timeline: Timeline) => {
  for (const [index, { x, y, z, rotationX, rotationY }] of DIAMOND_FACETS.entries()) {
    const facet = `${part("facet")}[data-index="${index}"]`;
    const at = FACETS_AT + index * FACET_STEP_S;

    timeline
      .fromTo(
        facet,
        { x, y, z, rotationX, rotationY, transformPerspective: 1000 },
        { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, duration: FACET_S, ease: FACET },
        at,
      )
      .fromTo(facet, { opacity: 0 }, { opacity: 1, duration: FACET_S * 0.35, ease: FACET }, at);
  }
};

// Each shard of glass flung out along its line and spinning, fading as it goes, unseen until it
// leaves.
const glassFlies = (timeline: Timeline) => {
  for (const [index, { reach, delay, duration, spin }] of DIAMOND_GLASS.entries()) {
    timeline.fromTo(
      `${part("glass")}[data-index="${index}"]`,
      { x: 30, rotation: 0, opacity: 1 },
      { x: reach, rotation: spin, opacity: 0, duration, ease: RING, immediateRender: false },
      delay,
    );
  }
};

// Each feather of both wings unfurling from its root, the topmost of each fan first.
const wingsUnfurl = (timeline: Timeline) => {
  for (const fan of ["deep", "metal"] as const) {
    const feathers = DIAMOND_FANS[fan];

    for (const [index, [turn, scale]] of feathers.entries()) {
      const rank = feathers.length - 1 - index;

      timeline.fromTo(
        `${part("feather")}[data-fan="${fan}"][data-index="${index}"]`,
        FURLED,
        { "--turn": turn, "--grow": scale, opacity: 1, duration: 0.5, ease: FAN_OUT },
        FANS_AT[fan] + rank * FEATHER_STEP_S,
      );
    }
  }
};

// The name slammed down whole, out of a blur, its ghosts sliding into it from either side.
const nameSlams = (timeline: Timeline) => {
  timeline.fromTo(
    part("name"),
    { opacity: 0, scale: 1.9, filter: "blur(14px)" },
    {
      keyframes: [
        { opacity: 1, scale: 0.97, filter: "blur(0px)", duration: 0.33, ease: SLAM },
        { scale: 1, duration: 0.27, ease: SLAM },
      ],
    },
    "name",
  );

  for (const side of ["left", "right"] as const) {
    const ghost = `ghost-${side}`;
    const x = GHOSTS[side];

    timeline
      .fromTo(
        part(ghost),
        { x, scale: 1.4 },
        { x: 0, scale: 1, duration: 0.8, ease: EASE_OUT },
        "name",
      )
      .fromTo(
        part(ghost),
        { opacity: 0 },
        {
          keyframes: [
            { opacity: 0.9, duration: 0.16, ease: EASE_OUT },
            { opacity: 0, duration: 0.64, ease: EASE_OUT },
          ],
        },
        "name",
      );
  }
};

// Platinum → Diamond, as its artboard « 5 · Platine → Diamant » plays it, keyframe for keyframe,
// with its timings and its curves: the stage darkens and the Platinum implodes into a heart of
// light that streaks of light rush into and feed; the Diamond's facets fly in one by one, turning
// in depth, and its cut is traced in light; the gem slams down in a blinding white, with a line of
// light across the stage and a beam down it, the screen shaking, a flash of its shape, its full
// Aura lighting up, the halo, three rings, shards of glass flung out and sparks; its wings unfurl
// feather by feather, their crystals and its glint pop in; then its name, slammed down whole with
// its ghosts, and the caption. As in the artboard, the two wheels of rays turn against each other
// from the start, unseen until they fade in; the halo breathes from 4.6 s, the wings flutter and
// the glint twinkles from 4.8 s, and the stars around twinkle each in its turn.
export const diamondChoreography: Choreography = {
  beats: { dissolve: 0.8, impact: IMPACT, name: 3.95, wait: 5.3 },
  sounds: {
    dissolve: "tier-up-diamond-implode",
    impact: "tier-up-diamond-slam",
    name: "tier-up-diamond-name",
  },
  cues: [{ sound: "tier-up-diamond-converge", at: FACETS_AT }],
  title: {
    size: 132,
    leading: 1.02,
    tracking: 0.06,
    shadow: { y: 8, blur: 36, percent: 60 },
    ghosts: PRISM,
  },
  scene: ({ from, to }) => (
    <>
      <TierUpGround tier={to} ground={{ tint: "outline", percent: 42 }} />
      <TierUpShade tier={to} />
      <TierUpDiamondRays tier={to} />
      <TierUpImplosion tier={to} />
      <div data-tier-up="shake" className="absolute inset-0">
        <TierUpDiamondHalo tier={to} />
        <TierUpGlass tier={to} />
        <TierUpSparks tier={to} sparks={DIAMOND_SPARKS} glow={12} />
        <TierUpTwinkles tier={to} />
        <TierUpOldEmblem tier={from} size={220} />
        <TierUpCutEmblem tier={to} />
      </div>
      <TierUpGlare tier={to} />
    </>
  ),
  intro: (timeline) => {
    implodes(timeline);
    facetsMeet(timeline);

    timeline
      .fromTo(
        part("cut-trace"),
        { attr: UNDRAWN },
        { attr: DRAWN, duration: 0.5, ease: EASE_IN_OUT },
        CUT_AT,
      )
      .fromTo(part("cut"), { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE_OUT }, 3.9);

    flash(timeline, part("flash"), 0.8, 3.78);
    flash(timeline, part("whiteout"), 1.1, 3.78, 0.08);
    flash(timeline, part("beam"), 1, 3.82);
    shakeThrough(timeline, SHAKE, SHAKE_S, "impact");

    timeline
      .fromTo(
        `${part("body")}, ${part("engraving")}`,
        { opacity: 0 },
        { opacity: 1, duration: 0.08 },
        "impact",
      )
      .to(
        part("emblem"),
        {
          keyframes: [
            { scale: 1.12, duration: 0.18, ease: LAND },
            { scale: 1, duration: 0.42, ease: LAND },
          ],
        },
        "impact",
      )
      .fromTo(part("aura"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE_OUT }, "impact")
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, "impact")
      .fromTo(part("haze"), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: EASE_OUT }, 3.9)
      .fromTo(
        part("halo"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.8, ease: EASE_OUT },
        "impact",
      )
      .fromTo(part("rays"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, "impact")
      .fromTo(part("rays-back"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, 4)
      // The line of light across the stage: whole at once, then stretched thin as it fades.
      .fromTo(
        part("horizon"),
        { scaleX: 0, scaleY: 1, opacity: 0 },
        {
          keyframes: [
            { scaleX: 1, opacity: 1, duration: 0.18, ease: EASE_OUT },
            { scaleX: 1.25, scaleY: 0.3, opacity: 0, duration: 1.02, ease: EASE_OUT },
          ],
        },
        "impact",
      );

    ringOut(timeline, "ring", { at: "impact", duration: 0.9, ease: RING });
    ringOut(timeline, "ring-mid", { at: 3.95, duration: 1.1, ease: RING });
    ringOut(timeline, "ring-wide", { at: 4.12, duration: 1.4, ease: RING });
    glassFlies(timeline);
    sparksOut(timeline, DIAMOND_SPARKS);
    wingsUnfurl(timeline);
    popIn(timeline, part("crystal"), { at: 4.15, duration: 0.4, peak: 1.35, ease: STUD_POP });
    popIn(timeline, `${part("engraving")} > g`, {
      at: 4.4,
      duration: 0.4,
      peak: 1.35,
      ease: STUD_POP,
    });
    nameSlams(timeline);
    captionLinesIn(timeline, { kicker: 4.2, route: 4.5, proceed: 4.8 });
  },
  idle: (timeline) => {
    breathe(timeline, 4.6, 2.6);
    timeline
      .fromTo(
        `${part("rays")} > div`,
        { rotation: 0 },
        { rotation: 360, duration: 36, ease: "none", repeat: -1 },
        0,
      )
      .fromTo(
        `${part("rays-back")} > div`,
        { rotation: 0 },
        { rotation: -360, duration: 24, ease: "none", repeat: -1 },
        0,
      )
      .to(
        part("wing"),
        {
          keyframes: [
            { "--flap": FLUTTER.flap, duration: FLUTTER.period / 2, ease: EASE_IN_OUT },
            { "--flap": 0, duration: FLUTTER.period / 2, ease: EASE_IN_OUT },
          ],
          repeat: -1,
        },
        FLUTTER.at,
      )
      // The glint gone at once, then twinkling in and out, turning as it does.
      .fromTo(
        `${part("engraving")} > g`,
        { "--pop": 0, "--spin": 0, opacity: 0 },
        {
          keyframes: [
            {
              "--pop": 1,
              "--spin": GLINT.spin,
              opacity: 1,
              duration: GLINT.period / 2,
              ease: EASE_IN_OUT,
            },
            { "--pop": 0, "--spin": 0, opacity: 0, duration: GLINT.period / 2, ease: EASE_IN_OUT },
          ],
          repeat: -1,
          immediateRender: false,
        },
        GLINT.at,
      );

    // Each star twinkling in its turn, again and again, turning as it does.
    for (const [index, { delay }] of DIAMOND_TWINKLES.entries()) {
      timeline.fromTo(
        `${part("twinkle")}[data-index="${index}"]`,
        { scale: 0, rotation: 0, opacity: 0 },
        {
          keyframes: [
            { scale: 1, rotation: 45, opacity: 1, duration: TWINKLE_S / 2, ease: EASE_IN_OUT },
            { scale: 0, rotation: 0, opacity: 0, duration: TWINKLE_S / 2, ease: EASE_IN_OUT },
          ],
          repeat: -1,
        },
        delay,
      );
    }
  },
};

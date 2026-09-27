import { ARGENT_SPARKS } from "@/components/tier-up/spark-burst";
import { TierUpArgentHalo } from "@/components/tier-up/tier-up-argent-halo";
import type { Choreography } from "@/components/tier-up/tier-up-choreography";
import {
  EASE_OUT,
  POP,
  RING,
  SHARD,
  SPLIT,
  STAMP,
  SWEEP,
} from "@/components/tier-up/tier-up-eases";
import { TierUpGround } from "@/components/tier-up/tier-up-ground";
import {
  breathe,
  captionIn,
  flash,
  RISE,
  RISEN,
  ringOut,
  sparksOut,
} from "@/components/tier-up/tier-up-moves";
import { part } from "@/components/tier-up/tier-up-part";
import { TIER_UP_SHARDS } from "@/components/tier-up/tier-up-shards";
import { TIER_UP_HALVES } from "@/components/tier-up/tier-up-halves";
import { SHEEN } from "@/components/tier-up/tier-up-sheen";
import { TierUpSparks } from "@/components/tier-up/tier-up-sparks";
import { TierUpSplitEmblem } from "@/components/tier-up/tier-up-split-emblem";
import { TierUpStruckEmblem } from "@/components/tier-up/tier-up-struck-emblem";

// The screen shaking as the Argent strikes: from x, y (px), each step 12 % of 0.4 s, dying down,
// then still again over the last 16 %.
const SHAKE = [
  [-12, 8],
  [10, -9],
  [-8, -5],
  [7, 6],
  [-4, 3],
  [3, -2],
  [-2, 1],
] as const;

const SHAKE_S = 0.4;

// A chevron stamped in, as its artboard times it: from twice its size to a little under at 70 %
// of 0.3 s, then to its size.
const STAMP_S = 0.3;

const STAMP_SETTLES_S = STAMP_S * 0.7;

// When the first chevron is stamped in, then seconds between the two.
const STAMP_AT = 2.3;

const STAMP_STEP_S = 0.25;

// When the light sweeps over the metal.
const SWEEP_AT = 2.95;

// Bronze → Argent, as its artboard « 2 · Bronze → Argent » plays it, keyframe for keyframe, with
// its timings and its curves: the bronze shield rises in, cracks down its middle and splits in
// two halves falling apart; the silver Emblem's quarters fly in and meet, it strikes like a stamp
// with the screen shaking, a flash along the seams and of its shape, the halo opening, two rings
// and sparks; each chevron is stamped in with a small ring, a light sweeps over the metal; then
// the caption. As in the artboard, the dashed rings turn from the start, unseen until they fade
// in, and the halo breathes from 2.8 s.
export const argentChoreography: Choreography = {
  beats: { dissolve: 0.9, impact: 1.95, name: 2.6, wait: 3.95 },
  sounds: {
    dissolve: "tier-up-argent-crack",
    impact: "tier-up-argent-impact",
    name: "tier-up-argent-name",
  },
  cues: [
    { sound: "tier-up-argent-stamp", at: STAMP_AT },
    { sound: "tier-up-argent-stamp", at: STAMP_AT + STAMP_STEP_S },
    { sound: "tier-up-argent-sweep", at: SWEEP_AT },
  ],
  scene: ({ from, to }) => (
    <>
      <TierUpGround tier={to} bloom={{ reach: "40% 44%", percent: 28 }} />
      <div data-tier-up="shake" className="absolute inset-0">
        <TierUpArgentHalo tier={to} />
        <TierUpSparks tier={to} sparks={ARGENT_SPARKS} glow={12} />
        <TierUpSplitEmblem tier={from} reached={to} />
        <TierUpStruckEmblem tier={to} />
      </div>
    </>
  ),
  intro: (timeline) => {
    timeline
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, 0)
      .fromTo(part("old"), RISE, { ...RISEN, duration: 0.6 }, 0.1)
      // The crack runs down the bronze, then fades as it splits.
      .fromTo(
        part("crack"),
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.135, ease: EASE_OUT },
        "dissolve",
      )
      .to(
        part("crack"),
        { scaleY: 1.1, opacity: 0, duration: 0.315, ease: EASE_OUT },
        "dissolve+=0.135",
      );

    for (const { part: half, x, rotation } of TIER_UP_HALVES) {
      timeline.fromTo(
        part(half),
        { x: 0, y: 0, rotation: 0, opacity: 1, filter: "blur(0px)" },
        { x, y: 40, rotation, opacity: 0, filter: "blur(3px)", duration: 0.75, ease: SPLIT },
        "dissolve+=0.1",
      );
    }

    // The quarters of the silver fly in, seen from a quarter of their flight.
    for (const [index, { x, y, rotation }] of TIER_UP_SHARDS.entries()) {
      const shard = `${part("shard")}:nth-child(${index + 1})`;

      timeline
        .fromTo(
          shard,
          { x, y, rotation, scale: 1.25 },
          { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.55, ease: SHARD },
          1.4,
        )
        .fromTo(shard, { opacity: 0 }, { opacity: 1, duration: 0.1375, ease: SHARD }, 1.4);
    }

    timeline.to(
      part("shake"),
      {
        keyframes: [
          ...SHAKE.map(([x, y]) => ({ x, y, duration: SHAKE_S * 0.12, ease: "none" })),
          { x: 0, y: 0, duration: SHAKE_S * 0.16, ease: "none" },
        ],
      },
      "impact",
    );

    flash(timeline, part("seams"), 0.6, "impact");
    flash(timeline, part("flash"), 0.6, "impact")
      .to(
        part("emblem"),
        {
          keyframes: [
            { scale: 1.08, duration: 0.1575, ease: EASE_OUT },
            { scale: 1, duration: 0.2925, ease: EASE_OUT },
          ],
        },
        "impact",
      )
      .fromTo(
        part("bloom"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 1.2, ease: POP },
        "impact",
      )
      .fromTo(
        part("halo"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.8, ease: EASE_OUT },
        "impact",
      )
      .fromTo(part("fill"), { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, 2)
      .fromTo(part("orbit"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE_OUT }, 2)
      .fromTo(
        part("orbit-back"),
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: EASE_OUT },
        2.2,
      );

    ringOut(timeline, "ring", { at: "impact", duration: 1, ease: RING });
    ringOut(timeline, "ring-wide", { at: 2.1, duration: 1.2, ease: RING });
    ringOut(timeline, "ring-stamp-1", { at: 2.4, duration: 0.6, ease: EASE_OUT });
    ringOut(timeline, "ring-stamp-2", { at: 2.65, duration: 0.6, ease: EASE_OUT });
    sparksOut(timeline, ARGENT_SPARKS);

    // Each chevron stamped in, a quarter of a second after the other, scaled about its own centre
    // through `--stamp` (see `TierUpStruckEmblem`).
    const chevrons = `${part("engraving")} > g`;

    timeline
      .fromTo(
        chevrons,
        { "--stamp": 1.9, opacity: 0 },
        {
          "--stamp": 0.94,
          opacity: 1,
          duration: STAMP_SETTLES_S,
          ease: STAMP,
          stagger: STAMP_STEP_S,
        },
        STAMP_AT,
      )
      .to(
        chevrons,
        {
          "--stamp": 1,
          duration: STAMP_S - STAMP_SETTLES_S,
          ease: STAMP,
          stagger: STAMP_STEP_S,
        },
        STAMP_AT + STAMP_SETTLES_S,
      )
      // As an attribute, in the grid's units: GSAP never parses an SVG transform.
      .fromTo(
        part("sheen"),
        { attr: { x: SHEEN.x } },
        { attr: { x: SHEEN.x + SHEEN.sweep }, duration: 0.9, ease: SWEEP },
        SWEEP_AT,
      );

    captionIn(timeline, { kicker: 2.5, route: 3.15, proceed: 3.45 });
  },
  idle: (timeline) => {
    breathe(timeline, 2.8);
    timeline
      .fromTo(
        `${part("orbit")} > div`,
        { rotation: 0 },
        { rotation: 360, duration: 22, ease: "none", repeat: -1 },
        0,
      )
      .fromTo(
        `${part("orbit-back")} > div`,
        { rotation: 0 },
        { rotation: -360, duration: 30, ease: "none", repeat: -1 },
        0,
      );
  },
};

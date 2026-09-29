import { GOLD_GLITTER, GOLD_SPARKS } from "@/components/tier-up/choreography/gold/gold-sparks";
import { LEAF_PAIRS } from "@/components/tier-up/choreography/gold/laurel-leaves";
import { TierUpGlitter } from "@/components/tier-up/choreography/gold/tier-up-glitter";
import { TierUpGoldHalo } from "@/components/tier-up/choreography/gold/tier-up-gold-halo";
import { TierUpGoldLight } from "@/components/tier-up/choreography/gold/tier-up-gold-light";
import { TierUpMaterializedEmblem } from "@/components/tier-up/choreography/gold/tier-up-materialized-emblem";
import { TierUpWhiteout } from "@/components/tier-up/parts/tier-up-whiteout";
import type { Choreography } from "@/components/tier-up/choreography/tier-up-choreography";
import {
  ASCEND,
  COLUMN,
  EASE_IN_OUT,
  EASE_OUT,
  FALL,
  POP,
  POP_OVER,
  RING,
} from "@/components/tier-up/choreography/tier-up-eases";
import {
  breathe,
  captionIn,
  DRAWN,
  flash,
  popIn,
  RISE,
  RISEN,
  ringOut,
  shake,
  sparksOut,
  UNDRAWN,
} from "@/components/tier-up/choreography/tier-up-moves";
import { part } from "@/components/tier-up/choreography/tier-up-part";
import { TierUpGround } from "@/components/tier-up/parts/tier-up-ground";
import { TierUpOldEmblem } from "@/components/tier-up/parts/tier-up-old-emblem";
import { TierUpSparks } from "@/components/tier-up/parts/tier-up-sparks";

type Timeline = gsap.core.Timeline;

// The screen shaking as the Gold materializes, over 0.45 s: through each x, y (px), dying down.
const SHAKE = [
  [-14, 9],
  [12, -11],
  [-9, -6],
  [8, 7],
  [-5, 4],
  [4, -3],
  [-2, 2],
] as const;

const SHAKE_S = 0.45;

// When the Gold materializes out of the white, and in how long: whole at the impact.
const MATERIALIZE_AT = 1.45;

const MATERIALIZE_S = 0.55;

// When the leaves pop in, then seconds between two pairs of them.
const LEAVES_AT = 2.3;

const LEAF_STEP_S = 0.08;

// A leaf or the stud popping in, as its artboard's `pop` does: a little over its size, then to it.
const POP_PEAK = 1.25;

// Each piece of glitter falling from where it starts, turning, seen once it is on its way and
// gone before it lands.
const glitterFalls = (timeline: Timeline) => {
  for (const [index, { fall, turn, delay, duration }] of GOLD_GLITTER.entries()) {
    const piece = `${part("glitter")}:nth-child(${index + 1})`;

    timeline
      .fromTo(
        piece,
        { y: 0, rotation: 0 },
        { y: fall, rotation: turn, duration, ease: FALL },
        delay,
      )
      .to(
        piece,
        {
          keyframes: [
            { opacity: 1, duration: duration * 0.1, ease: FALL },
            { opacity: 1, duration: duration * 0.75, ease: "none" },
            { opacity: 0, duration: duration * 0.15, ease: FALL },
          ],
        },
        delay,
      );
  }
};

// Silver → Gold, as its artboard « 3 · Argent → Or » plays it, keyframe for keyframe, with its
// timings and its curves: the silver shield rises in, then rises further and fades into a column
// of light; the Gold materializes out of a blinding white, squeezed thin then whole, with a flash of
// its shape; it lands with the screen shaking, the halo and its full Aura lighting up, the rays
// fading in, two rings and sparks; its laurels trace themselves and their leaves pop in, its star
// is traced, then cut with a flash, its stud pops in, and glitter rains over the stage; then the
// caption, its name larger. As in the artboard, the rays turn from the start, unseen until they
// fade in, and the halo breathes from 2.8 s, every 2.8 s.
export const goldChoreography: Choreography = {
  beats: { dissolve: 0.8, impact: 2, name: 2.6, wait: 3.9 },
  sounds: {
    dissolve: "tier-up-gold-ascend",
    impact: "tier-up-gold-materialize",
    name: "tier-up-gold-name",
  },
  cues: [],
  title: { size: 140, leading: 0.95, tracking: 0.08, shadow: { y: 8, blur: 32, percent: 55 } },
  scene: ({ from, to }) => (
    <>
      <TierUpGround tier={to} bloom={{ reach: "45% 50%", percent: 30 }} />
      <TierUpGoldLight tier={to} />
      <div data-tier-up="shake" className="absolute inset-0">
        <TierUpGoldHalo tier={to} />
        <TierUpSparks tier={to} sparks={GOLD_SPARKS} glow={12} />
        <TierUpOldEmblem tier={from} />
        <TierUpMaterializedEmblem tier={to} />
      </div>
      <TierUpWhiteout tier={to} />
      <TierUpGlitter tier={to} glitter={GOLD_GLITTER} />
    </>
  ),
  intro: (timeline) => {
    timeline
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 1, ease: EASE_OUT }, 0)
      .fromTo(part("old"), RISE, { ...RISEN, duration: 0.6 }, 0.1)
      // The silver rising into the light, brighter and blurrier until it is gone.
      .fromTo(
        part("old-dissolve"),
        { y: 0, scale: 1, opacity: 1, filter: "brightness(1) blur(0px)" },
        {
          y: -70,
          scale: 1.15,
          opacity: 0,
          filter: "brightness(3) blur(5px)",
          duration: 0.9,
          ease: ASCEND,
        },
        "dissolve",
      )
      // The column opening wide, narrowing a little, then closing.
      .to(
        part("column"),
        {
          keyframes: [
            { scaleX: 1, opacity: 1, duration: 0.325, ease: COLUMN },
            { scaleX: 0.7, opacity: 0.9, duration: 0.585, ease: COLUMN },
            { scaleX: 0, opacity: 0, duration: 0.39, ease: COLUMN },
          ],
        },
        1.1,
      )
      // Out of the white, squeezed thin and tall, then whole: seen from the first half of it.
      .fromTo(
        part("materialize"),
        { scaleX: 0.06, scaleY: 1.25, filter: "brightness(5)" },
        { scaleX: 1, scaleY: 1, filter: "brightness(1)", duration: MATERIALIZE_S, ease: POP },
        MATERIALIZE_AT,
      )
      .fromTo(
        part("materialize"),
        { opacity: 0 },
        { opacity: 1, duration: MATERIALIZE_S * 0.55, ease: POP },
        MATERIALIZE_AT,
      );

    flash(timeline, part("flash"), 0.7, 1.98);
    flash(timeline, part("whiteout"), 0.8, 1.98, 0.1);
    shake(timeline, SHAKE, SHAKE_S, "impact")
      .to(
        part("emblem"),
        {
          keyframes: [
            { scale: 1.09, duration: 0.175, ease: EASE_OUT },
            { scale: 1, duration: 0.325, ease: EASE_OUT },
          ],
        },
        "impact",
      )
      .fromTo(part("aura"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: EASE_OUT }, "impact")
      .fromTo(
        part("bloom"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 1.4, ease: POP },
        "impact",
      )
      .fromTo(
        part("halo"),
        { opacity: 0, scale: 0.3 },
        { opacity: 1, scale: 1, duration: 0.8, ease: EASE_OUT },
        "impact",
      )
      .fromTo(
        part("rays"),
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: EASE_OUT },
        "impact",
      );

    ringOut(timeline, "ring", { at: "impact", duration: 1, ease: RING });
    ringOut(timeline, "ring-wide", { at: 2.18, duration: 1.3, ease: RING });
    sparksOut(timeline, GOLD_SPARKS);

    timeline
      .fromTo(
        part("star-trace"),
        { attr: UNDRAWN },
        { attr: DRAWN, duration: 0.45, ease: EASE_IN_OUT },
        2.15,
      )
      .fromTo(
        `${part("laurel")} path`,
        { attr: UNDRAWN },
        { attr: DRAWN, duration: 0.7, ease: EASE_OUT },
        2.2,
      )
      .fromTo(
        // The star as a whole: its layers keep their own opacity.
        `${part("engraving")} > g`,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: EASE_OUT },
        2.5,
      );

    // The leaves, pair by pair from the foot up; the stud, once the star is cut.
    for (let pair = 0; pair < LEAF_PAIRS; pair++) {
      popIn(timeline, part(`leaf-${pair}`), {
        at: LEAVES_AT + pair * LEAF_STEP_S,
        duration: 0.32,
        peak: POP_PEAK,
        ease: POP_OVER,
      });
    }

    flash(timeline, part("star-flash"), 0.6, 2.5);
    popIn(timeline, `${part("engraving")} > circle`, {
      at: 2.75,
      duration: 0.35,
      peak: POP_PEAK,
      ease: POP_OVER,
    });
    glitterFalls(timeline);
    captionIn(timeline, {
      kicker: 2.5,
      route: 3.1,
      proceed: 3.4,
      letters: { duration: 0.55, stagger: 0.1, scale: 1.3 },
    });
  },
  idle: (timeline) => {
    breathe(timeline, 2.8, 2.8);
    timeline.fromTo(
      `${part("rays")} > div`,
      { rotation: 0 },
      { rotation: 360, duration: 50, ease: "none", repeat: -1 },
      0,
    );
  },
};

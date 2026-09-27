import { TIER_UP_SPARKS } from "@/components/tier-up/spark-burst";
import type { Choreography } from "@/components/tier-up/tier-up-choreography";
import { DISSOLVE, DRAW, EASE_OUT, POP, RING } from "@/components/tier-up/tier-up-eases";
import { TierUpEmblem } from "@/components/tier-up/tier-up-emblem";
import { TierUpGround } from "@/components/tier-up/tier-up-ground";
import { TierUpHalo } from "@/components/tier-up/tier-up-halo";
import {
  breathe,
  captionIn,
  flash,
  RISE,
  RISEN,
  ringOut,
  sparksOut,
} from "@/components/tier-up/tier-up-moves";
import { TierUpOldEmblem } from "@/components/tier-up/tier-up-old-emblem";
import { part } from "@/components/tier-up/tier-up-part";
import { TierUpSparks } from "@/components/tier-up/tier-up-sparks";

// A line traced from nothing to whole: its length set to 1, one dash as long, pushed off it,
// then back. As SVG attributes, plain numbers: as CSS, GSAP would round the `px` of the offset
// to 1 or 0, and the line would pop in instead of tracing itself.
const UNDRAWN = { pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 };

const DRAWN = { pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 0 };

// Fer → Bronze, as its artboard « 1 · Fer → Bronze » plays it, keyframe for keyframe, with its
// timings and its curves: the iron shield rises in, then dissolves into light; the bronze
// outline traces itself, its metal fills it in, its chevrons are cut, a flash, and it lands with
// the halo opening, a ring and sparks; then « Nouveau palier », the name letter by letter, the
// route and « Continuer ». The halo breathes from 3.1 s on, as in the artboard.
export const bronzeChoreography: Choreography = {
  beats: { dissolve: 1, impact: 2.3, name: 2.7, wait: 4 },
  sounds: {
    dissolve: "tier-up-bronze-dissolve",
    impact: "tier-up-bronze-impact",
    name: "tier-up-bronze-name",
  },
  scene: ({ from, to }) => (
    <>
      <TierUpGround tier={to} bloom={{ reach: "38% 42%", percent: 32 }} />
      <TierUpHalo tier={to} />
      <TierUpSparks tier={to} sparks={TIER_UP_SPARKS} glow={10} />
      <TierUpOldEmblem tier={from} />
      <TierUpEmblem tier={to} />
    </>
  ),
  intro: (timeline) => {
    timeline
      .fromTo(part("ground"), { opacity: 0 }, { opacity: 1, duration: 1.2, ease: EASE_OUT }, 0)
      .fromTo(part("old"), RISE, { ...RISEN, duration: 0.6 }, 0.1)
      .fromTo(
        part("old-dissolve"),
        { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" },
        {
          opacity: 0,
          scale: 0.55,
          filter: "blur(8px) brightness(2.2)",
          duration: 0.55,
          ease: DISSOLVE,
        },
        "dissolve",
      )
      .fromTo(
        part("outline"),
        { attr: UNDRAWN },
        { attr: DRAWN, duration: 1.1, ease: DRAW },
        "dissolve+=0.1",
      )
      .fromTo(part("fill"), { opacity: 0 }, { opacity: 1, duration: 0.45, ease: EASE_OUT }, 1.9)
      .fromTo(part("engraving"), { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, 2.15)
      // Each line cut in the metal traces itself, as the outline did.
      .fromTo(
        `${part("engraving")} path`,
        { attr: UNDRAWN },
        { attr: DRAWN, duration: 0.3, ease: EASE_OUT },
        2.15,
      );

    flash(timeline, part("flash"), 0.7, 2.25)
      .to(
        part("emblem"),
        {
          keyframes: [
            { scale: 1.07, duration: 0.175, ease: EASE_OUT },
            { scale: 1, duration: 0.325, ease: EASE_OUT },
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
      );

    ringOut(timeline, "ring", { at: "impact", duration: 1.1, ease: RING });
    sparksOut(timeline, TIER_UP_SPARKS);
    captionIn(timeline, { kicker: 2.6, route: 3.2, proceed: 3.5 });
  },
  idle: (timeline) => {
    breathe(timeline, 3.1);
  },
};

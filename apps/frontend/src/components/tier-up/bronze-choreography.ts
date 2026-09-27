import { TIER_UP_SPARKS } from "@/components/tier-up/spark-burst";
import type { Choreography } from "@/components/tier-up/tier-up-choreography";
import {
  DISSOLVE,
  DRAW,
  EASE_IN_OUT,
  EASE_OUT,
  POP,
  RING,
  SPARK,
} from "@/components/tier-up/tier-up-eases";
import { part } from "@/components/tier-up/tier-up-part";

// A caption line rising into place, in half a second.
const RISE = { opacity: 0, y: 28 };

const RISEN = { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT };

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
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.1, ease: DRAW },
        "dissolve+=0.1",
      )
      .fromTo(part("fill"), { opacity: 0 }, { opacity: 1, duration: 0.45, ease: EASE_OUT }, 1.9)
      .fromTo(part("engraving"), { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, 2.15)
      // Each line cut in the metal traces itself, as the outline did.
      .fromTo(
        `${part("engraving")} path`,
        { attr: { pathLength: 1 }, strokeDasharray: 1, strokeDashoffset: 1 },
        {
          attr: { pathLength: 1 },
          strokeDasharray: 1,
          strokeDashoffset: 0,
          duration: 0.3,
          ease: EASE_OUT,
        },
        2.15,
      )
      .to(
        part("flash"),
        {
          keyframes: [
            { opacity: 1, duration: 0.084, ease: EASE_OUT },
            { opacity: 0, duration: 0.616, ease: EASE_OUT },
          ],
        },
        2.25,
      )
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
      )
      .fromTo(
        part("ring"),
        { opacity: 1, scale: 0.15 },
        { opacity: 0, scale: 1, duration: 1.1, ease: RING },
        "impact",
      );

    // Each spark on its own flight, all from the Emblem's centre, unseen until it leaves.
    for (const [index, { x, y, delay, duration }] of TIER_UP_SPARKS.entries()) {
      timeline.fromTo(
        `${part("spark")}:nth-child(${index + 1})`,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        { x, y, scale: 0, opacity: 0, duration, ease: SPARK, immediateRender: false },
        `impact+=${delay}`,
      );
    }

    timeline
      .fromTo(part("kicker"), RISE, RISEN, 2.6)
      .fromTo(
        part("letter"),
        { opacity: 0, y: 46, scale: 1.25, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: POP,
          stagger: 0.05,
        },
        "name",
      )
      .fromTo(part("route"), RISE, RISEN, 3.2)
      .fromTo(part("continue"), RISE, RISEN, 3.5);
  },
  idle: (timeline) => {
    timeline.to(
      part("breath"),
      {
        keyframes: [
          { scale: 1.08, opacity: 0.75, duration: 1.5, ease: EASE_IN_OUT },
          { scale: 1, opacity: 1, duration: 1.5, ease: EASE_IN_OUT },
        ],
        repeat: -1,
      },
      3.1,
    );
  },
};

import { BRONZE_SPARKS } from "@/components/tier-up/choreography/bronze/bronze-sparks";
import { TierUpEmblem } from "@/components/tier-up/choreography/bronze/tier-up-emblem";
import { TierUpHalo } from "@/components/tier-up/choreography/bronze/tier-up-halo";
import type { Choreography } from "@/components/tier-up/choreography/tier-up-choreography";
import {
  DISSOLVE,
  DRAW,
  EASE_OUT,
  POP,
  RING,
} from "@/components/tier-up/choreography/tier-up-eases";
import {
  breathe,
  captionIn,
  DRAWN,
  flash,
  RISE,
  RISEN,
  ringOut,
  sparksOut,
  UNDRAWN,
} from "@/components/tier-up/choreography/tier-up-moves";
import { part } from "@/components/tier-up/choreography/tier-up-part";
import { TierUpGround } from "@/components/tier-up/parts/tier-up-ground";
import { TierUpOldEmblem } from "@/components/tier-up/parts/tier-up-old-emblem";
import { TierUpSparks } from "@/components/tier-up/parts/tier-up-sparks";

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
  cues: [],
  scene: ({ from, to }) => (
    <>
      <TierUpGround tier={to} bloom={{ reach: "38% 42%", percent: 32 }} />
      <TierUpHalo tier={to} />
      <TierUpSparks tier={to} sparks={BRONZE_SPARKS} glow={10} />
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
    sparksOut(timeline, BRONZE_SPARKS);
    captionIn(timeline, { kicker: 2.6, route: 3.2, proceed: 3.5 });
  },
  idle: (timeline) => {
    breathe(timeline, 3.1);
  },
};

import { EASE_IN_OUT, EASE_OUT, POP, SPARK } from "@/components/tier-up/choreography/tier-up-eases";
import { part } from "@/components/tier-up/choreography/tier-up-part";
import type { TierUpSpark } from "@/components/tier-up/parts/spark-burst";

// The moves every Tier-up makes, each at its own time: its caption coming in, its sparks, its
// rings, its flashes and its breathing halo. Built onto the timeline, with the parts' selectors.

type Timeline = gsap.core.Timeline;

// A line traced from nothing to whole: its length set to 1, one dash as long, pushed off it,
// then back. As SVG attributes, plain numbers: as CSS, GSAP would round the `px` of the offset
// to 1 or 0, and the line would pop in instead of tracing itself.
export const UNDRAWN = { pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 };

export const DRAWN = { pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 0 };

// A caption line rising into place, in half a second.
export const RISE = { opacity: 0, y: 28 };

export const RISEN = { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT };

// How each letter of the name comes in: in how long (s), how long after the one before (s), and
// from how large.
type Letters = { duration: number; stagger: number; scale: number };

const LETTERS: Letters = { duration: 0.5, stagger: 0.05, scale: 1.25 };

// When each line of the caption rises: the name comes in at the `name` label, its letters as
// `letters` says (its artboard's own, or the usual ones).
type CaptionTimes = { kicker: number; route: number; proceed: number; letters?: Letters };

// « Nouveau palier », then the name letter by letter, the route and « Continuer ».
export const captionIn = (
  timeline: Timeline,
  { kicker, route, proceed, letters = LETTERS }: CaptionTimes,
) =>
  timeline
    .fromTo(part("kicker"), RISE, RISEN, kicker)
    .fromTo(
      part("letter"),
      { opacity: 0, y: 46, scale: letters.scale, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: letters.duration,
        ease: POP,
        stagger: letters.stagger,
      },
      "name",
    )
    .fromTo(part("route"), RISE, RISEN, route)
    .fromTo(part("continue"), RISE, RISEN, proceed);

// Each spark on its own flight from the impact, all from the Emblem's centre, unseen until it
// leaves.
export const sparksOut = (timeline: Timeline, sparks: readonly TierUpSpark[]) => {
  for (const [index, { x, y, delay, duration }] of sparks.entries()) {
    timeline.fromTo(
      `${part("spark")}:nth-child(${index + 1})`,
      { x: 0, y: 0, scale: 1, opacity: 1 },
      { x, y, scale: 0, opacity: 0, duration, ease: SPARK, immediateRender: false },
      `impact+=${delay}`,
    );
  }
};

// A ring flying out of the centre, fading as it grows, from small and lit.
export const ringOut = (
  timeline: Timeline,
  name: string,
  { at, duration, ease }: { at: number | string; duration: number; ease: gsap.EaseFunction },
) =>
  timeline.fromTo(
    part(name),
    { opacity: 1, scale: 0.15 },
    { opacity: 0, scale: 1, duration, ease },
    at,
  );

// A light coming on at once and fading out over `duration`, as the canvas's flash does: full at
// `peak` of it (12 %, unless its artboard says otherwise).
export const flash = (
  timeline: Timeline,
  target: string,
  duration: number,
  at: number | string,
  peak = 0.12,
) =>
  timeline.to(
    target,
    {
      keyframes: [
        { opacity: 1, duration: duration * peak, ease: EASE_OUT },
        { opacity: 0, duration: duration * (1 - peak), ease: EASE_OUT },
      ],
    },
    at,
  );

// The screen shaking as the Blason lands, over `duration`: through each x, y (px), 12 % of it
// each, dying down, then still again over the rest.
export const shake = (
  timeline: Timeline,
  steps: readonly (readonly [x: number, y: number])[],
  duration: number,
  at: number | string,
) =>
  timeline.to(
    part("shake"),
    {
      keyframes: [
        ...steps.map(([x, y]) => ({ x, y, duration: duration * 0.12, ease: "none" })),
        { x: 0, y: 0, duration: duration * (1 - steps.length * 0.12), ease: "none" },
      ],
    },
    at,
  );

// The halo breathing, every `period` s (3, unless its artboard says otherwise), for as long as the
// Tier-up waits.
export const breathe = (timeline: Timeline, at: number, period = 3) =>
  timeline.to(
    part("breath"),
    {
      keyframes: [
        { scale: 1.08, opacity: 0.75, duration: period / 2, ease: EASE_IN_OUT },
        { scale: 1, opacity: 1, duration: period / 2, ease: EASE_IN_OUT },
      ],
      repeat: -1,
    },
    at,
  );

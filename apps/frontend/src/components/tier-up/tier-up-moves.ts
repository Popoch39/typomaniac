import type { TierUpSpark } from "@/components/tier-up/spark-burst";
import { EASE_IN_OUT, EASE_OUT, POP, SPARK } from "@/components/tier-up/tier-up-eases";
import { part } from "@/components/tier-up/tier-up-part";

// The moves every Tier-up makes, each at its own time: its caption coming in, its sparks, its
// rings, its flashes and its breathing halo. Built onto the timeline, with the parts' selectors.

type Timeline = gsap.core.Timeline;

// A caption line rising into place, in half a second.
export const RISE = { opacity: 0, y: 28 };

export const RISEN = { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT };

// When each line of the caption rises: the name comes in at the `name` label.
type CaptionTimes = { kicker: number; route: number; proceed: number };

// « Nouveau palier », then the name letter by letter, the route and « Continuer ».
export const captionIn = (timeline: Timeline, { kicker, route, proceed }: CaptionTimes) =>
  timeline
    .fromTo(part("kicker"), RISE, RISEN, kicker)
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
// 12 % of it.
export const flash = (timeline: Timeline, target: string, duration: number, at: number | string) =>
  timeline.to(
    target,
    {
      keyframes: [
        { opacity: 1, duration: duration * 0.12, ease: EASE_OUT },
        { opacity: 0, duration: duration * 0.88, ease: EASE_OUT },
      ],
    },
    at,
  );

// The halo breathing, every 3 s, for as long as the Tier-up waits.
export const breathe = (timeline: Timeline, at: number) =>
  timeline.to(
    part("breath"),
    {
      keyframes: [
        { scale: 1.08, opacity: 0.75, duration: 1.5, ease: EASE_IN_OUT },
        { scale: 1, opacity: 1, duration: 1.5, ease: EASE_IN_OUT },
      ],
      repeat: -1,
    },
    at,
  );

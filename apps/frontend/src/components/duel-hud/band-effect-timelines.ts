import { gsap } from "gsap";

import {
  BROKEN_MS,
  MULTIPLIER_PUNCH_MS,
  PIP_PUNCH_MS,
  POP_MS,
} from "@/components/duel-hud/band-effects";

// How high a « +N » rises, in px.
const POP_RISE = 14;

// The « +N » of a word, as the board draws it over its 800 ms: in over the first tenth, held, faded
// out from 65 %, rising all along on 1 − (1 − p)³ (GSAP's power2.out), unless `rise` is off
// (reduced motion): then it only fades in and out. Paused: the Duel's clock seeks it.
export const popTimeline = (pop: HTMLElement, { rise }: { rise: boolean }) => {
  const seconds = POP_MS / 1000;
  const timeline = gsap.timeline({ paused: true });

  timeline
    .fromTo(pop, { opacity: 0 }, { opacity: 1, duration: seconds * 0.1, ease: "none" }, 0)
    .to(pop, { opacity: 0, duration: seconds * 0.35, ease: "none" }, seconds * 0.65);

  if (rise) {
    timeline.fromTo(pop, { y: 0 }, { y: -POP_RISE, duration: seconds, ease: "power2.out" }, 0);
  }

  return timeline;
};

// A punch: `amount` bigger at once, easing back to its size as the board does, 1 + amount ×
// (1 − p)² (GSAP's power1.out). `scale` is GSAP's, or a CSS variable when the element's own
// transform holds more than a scale.
const punchTimeline = (target: Element, ms: number, amount: number, scale: "scale" | "--punch") =>
  gsap
    .timeline({ paused: true })
    .fromTo(
      target,
      { [scale]: 1 + amount },
      { [scale]: 1, duration: ms / 1000, ease: "power1.out" },
    );

// The multiplier going up a step: 45 % bigger, back in 700 ms.
export const multiplierPunchTimeline = (multiplier: HTMLElement) =>
  punchTimeline(multiplier, MULTIPLIER_PUNCH_MS, 0.45, "scale");

// The pip a right word just lit: 60 % bigger, back in 320 ms, on its `--punch` (it is skewed too).
export const pipPunchTimeline = (pip: Element) => punchTimeline(pip, PIP_PUNCH_MS, 0.6, "--punch");

// The red a broken Combo turns the gauge's pips, fading out over 700 ms.
export const brokenTimeline = (reds: readonly Element[]) =>
  gsap
    .timeline({ paused: true })
    .fromTo(reds, { opacity: 0.85 }, { opacity: 0, duration: BROKEN_MS / 1000, ease: "none" });

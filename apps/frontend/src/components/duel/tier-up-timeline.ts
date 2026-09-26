import { gsap } from "gsap";

// The parts of the celebration the timeline moves, by their `data-tier-up`.
const HALO = '[data-tier-up="halo"]';

const EMBLEM = '[data-tier-up="emblem"]';

const DETAILS = '[data-tier-up="details"]';

// A move up into a new Tier or Maître: the halo blooms, the emblem lands in it with an overshoot,
// the title, TP and rank rise under it, then the halo keeps breathing. Transforms and opacity
// only. Built inside the celebration's GSAP context: its selectors stay within it.
export const tierUpTimeline = () =>
  gsap
    .timeline()
    .from(HALO, { scale: 0.2, opacity: 0, duration: 0.6, ease: "power2.out" })
    .from(
      EMBLEM,
      { scale: 0.3, opacity: 0, rotation: -18, y: 24, duration: 0.7, ease: "back.out(2.2)" },
      0.1,
    )
    .from(DETAILS, { opacity: 0, y: 12, duration: 0.4, ease: "power2.out" }, 0.5)
    .to(HALO, { scale: 1.12, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true });

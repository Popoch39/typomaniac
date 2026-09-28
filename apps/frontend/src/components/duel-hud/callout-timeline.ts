import { gsap } from "gsap";

// How long a Callout takes to come in, to punch back to its size and to fade out, in seconds.
const IN = 0.08;

const PUNCH = 0.16;

const OUT = 0.3;

// A Callout over its `lasts` ms, as the board draws it: faded in over 80 ms while it punches from
// 35 % bigger back to its size over 160 ms, both in a straight line, held, then faded out over its
// last 300 ms. Without the `punch` (reduced motion), it only fades in and out. The punch goes on
// its `--punch`: the Callout is tilted too. Paused: the Duel's clock seeks it.
export const calloutTimeline = (
  callout: HTMLElement,
  { lasts, punch }: { lasts: number; punch: boolean },
) => {
  const timeline = gsap.timeline({ paused: true });

  timeline
    .fromTo(callout, { opacity: 0 }, { opacity: 1, duration: IN, ease: "none" }, 0)
    .to(callout, { opacity: 0, duration: OUT, ease: "none" }, lasts / 1000 - OUT);

  if (punch) {
    timeline.fromTo(
      callout,
      { "--punch": 1.35 },
      { "--punch": 1, duration: PUNCH, ease: "none" },
      0,
    );
  }

  return timeline;
};

import { gsap } from "gsap";

// The ring's length around the disc: 2π × 38.
export const RING_LENGTH = 238.76;

// The last seconds of the Duel, when the disc beats and turns red.
export const URGENT_S = 5;

// How much bigger the disc is at each beat.
const BEAT = 1.07;

// The disc over the Duel, in seconds since GO: its ring empties over the time, and in the last
// seconds it beats once a second, big at once then easing back as the board does, 1 + 0.07 ×
// (1 − p)³ (GSAP's power2.out is that cube), unless `beat` is off (reduced motion). Paused: the
// Duel's clock seeks it.
export const discTimeline = (
  disc: HTMLElement,
  ring: SVGCircleElement,
  { seconds, beat }: { seconds: number; beat: boolean },
) => {
  const timeline = gsap.timeline({ paused: true });

  timeline.fromTo(
    ring,
    { attr: { "stroke-dashoffset": 0 } },
    { attr: { "stroke-dashoffset": RING_LENGTH }, duration: seconds, ease: "none" },
    0,
  );

  if (beat) {
    timeline.fromTo(
      disc,
      { scale: BEAT },
      {
        scale: 1,
        duration: 1,
        ease: "power2.out",
        repeat: URGENT_S - 1,
        immediateRender: false,
      },
      seconds - URGENT_S,
    );
  }

  return timeline;
};

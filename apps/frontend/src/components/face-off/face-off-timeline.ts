import { gsap } from "gsap";

// The server's Countdown, from the pairing to the start: the Face-off, then the 3-2-1.
export const COUNTDOWN_S = 4.5;

const FACE_OFF_S = 1.5;

// The 3-2-1 starts this long before the start.
export const COUNT_MS = (COUNTDOWN_S - FACE_OFF_S) * 1000;

// The panels meet in the middle this long after the pairing.
const IMPACT_S = 0.35;

// The halves burst out on GO and are gone this long after.
const EXIT_S = 0.45;

// The overlay stays this long past the start, for its exit.
export const EXIT_MS = EXIT_S * 1000;

// The giant marks after the Face-off, drawn by FaceOffCount: each slams in on its second of the
// Countdown and fades as the next one comes.
export const DIGITS = [
  { mark: "3", at: FACE_OFF_S, hold: 0.8 },
  { mark: "2", at: FACE_OFF_S + 1, hold: 0.8 },
  { mark: "1", at: FACE_OFF_S + 2, hold: 0.8 },
  { mark: "GO", at: COUNTDOWN_S, hold: 0.25 },
] as const;

// The `data-face-off` of a mark's element.
export const digitName = (mark: string) => `digit-${mark}`;

// A part of the overlay, found by its `data-face-off` inside the overlay (the useGSAP scope).
const part = (name: string) => `[data-face-off="${name}"]`;

const PANELS = [part("own"), part("opponent")];

// The screen shake at the impact: a few jolts of random direction, then back in place.
const shake = () => {
  const jolt = gsap.utils.random(-14, 14, 1, true);

  return [
    ...Array.from({ length: 5 }, () => ({ x: jolt(), y: jolt(), duration: 0.035 })),
    { x: 0, y: 0, duration: 0.05 },
  ];
};

// The whole Face-off overlay on a single timeline, paused: its time is the time since the pairing,
// set from the Duel's clock (never GSAP's own), so a seek lands anywhere. Transforms and opacity
// only; the diagonal cut is a static clip-path.
export const faceOffTimeline = () => {
  const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

  timeline
    .addLabel("entrance", 0)
    .set(PANELS, { willChange: "transform" }, "entrance")
    .fromTo(part("backdrop"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, "entrance")
    .fromTo(
      part("own"),
      { xPercent: -100 },
      { xPercent: 0, duration: IMPACT_S, ease: "power4.in" },
      "entrance",
    )
    .fromTo(
      part("opponent"),
      { xPercent: 100 },
      { xPercent: 0, duration: IMPACT_S, ease: "power4.in" },
      "entrance",
    )
    .addLabel("impact", IMPACT_S)
    .fromTo(
      part("vs"),
      { scale: 3.2, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.25, ease: "back.out(2.5)" },
      "impact",
    )
    .to(part("stage"), { keyframes: shake(), ease: "none" }, "impact")
    .addLabel("cascade", IMPACT_S + 0.15)
    .fromTo(
      part("reveal"),
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.08 },
      "cascade",
    )
    .set(PANELS, { willChange: "auto" }, "cascade")
    .addLabel("count", FACE_OFF_S)
    .to(part("vs"), { scale: 0.6, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, "count");

  for (const { mark, at, hold } of DIGITS) {
    timeline
      .fromTo(
        part(digitName(mark)),
        { scale: 2.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.2, ease: "power4.out" },
        at,
      )
      .to(
        part(digitName(mark)),
        { scale: 0.7, autoAlpha: 0, duration: 0.2, ease: "power2.in" },
        at + hold,
      );
  }

  return timeline
    .addLabel("go", COUNTDOWN_S)
    .set(PANELS, { willChange: "transform" }, "go-=0.1")
    .addLabel("exit", COUNTDOWN_S)
    .to(part("own"), { xPercent: -110, duration: EXIT_S, ease: "power3.in" }, "exit")
    .to(part("opponent"), { xPercent: 110, duration: EXIT_S, ease: "power3.in" }, "exit")
    .to(part("backdrop"), { autoAlpha: 0, duration: EXIT_S, ease: "power2.in" }, "exit");
};

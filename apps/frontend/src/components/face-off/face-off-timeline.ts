import { gsap } from "gsap";

import type { FaceOffSound } from "@/audio/face-off-sounds";

// The server's Countdown, from the pairing to the start: the Face-off, then the 3-2-1.
export const COUNTDOWN_S = 4.5;

const FACE_OFF_S = 1.5;

// The 3-2-1 starts this long before the start.
export const COUNT_MS = (COUNTDOWN_S - FACE_OFF_S) * 1000;

// The panels meet in the middle this long after the pairing.
const IMPACT_S = 0.35;

// Each player's avatar, Handle and rank rise into their panel this long after the pairing.
const REVEAL_S = 0.5;

// Then each player's Form comes in, one Ranked Duel after the other, then the average wpm.
const CASCADE_S = REVEAL_S + 0.22;

const CASCADE_STAGGER_S = 0.07;

// The Stake comes in with the reveal; what a win would add to its bar fills in a little after.
const STAKE_FILL_S = 0.9;

// The halves split out on GO, up and down, and are gone this long after.
const EXIT_S = 0.5;

// The overlay stays this long past the start, for its exit.
export const EXIT_MS = EXIT_S * 1000;

// `elapsed` ms since the start of the Duel is before its Countdown: the second of « C'est parti ! »
// of a Duel of the Queue.
export const beforeCountdown = (elapsed: number) => elapsed < -COUNTDOWN_S * 1000;

// How far the Handles' rows drift over the whole Face-off, in their own font size: the same speed
// whatever the Handle's length or the screen's size. Fast as the panels come in, slowing down
// through the 3-2-1.
const MARQUEE_DRIFT = "3em";

// The digits of the 3-2-1 in the disc, drawn by FaceOffCount: each slams in on its second of the
// Countdown and shrinks away as the next one comes. GO follows, at the start.
export const DIGITS = [
  { mark: "3", at: FACE_OFF_S },
  { mark: "2", at: FACE_OFF_S + 1 },
  { mark: "1", at: FACE_OFF_S + 2 },
] as const;

// A digit stays this long before it shrinks away.
const DIGIT_HOLD_S = 0.8;

// The `data-face-off` of a digit's element.
export const digitName = (mark: string) => `digit-${mark}`;

// The label of the timeline each sound plays on.
const SOUNDS = new Map<string, FaceOffSound>([
  ["entrance", "whoosh"],
  ["impact", "impact"],
  ...DIGITS.map(({ mark }): [string, FaceOffSound] => [digitName(mark), "beep"]),
  ["go", "go"],
]);

// A sound whose label was passed longer ago than this is left out: on a resume or a slow first
// frame, it would play out of step with the overlay.
const LATE_S = 0.15;

// The sounds of the timeline's `labels` passed since `heard` (the time up to which they were
// played) up to `at`, in their order.
export const soundsPassed = (labels: Readonly<Record<string, number>>, heard: number, at: number) =>
  Object.entries(labels)
    .toSorted(([, a], [, b]) => a - b)
    .flatMap(([label, time]) => {
      const sound = SOUNDS.get(label);

      return typeof sound === "undefined" || time <= heard || time > at || at - time > LATE_S
        ? []
        : [sound];
    });

// A part of the overlay, found by its `data-face-off` inside the overlay (the useGSAP scope).
const part = (name: string) => `[data-face-off="${name}"]`;

const PANELS = [part("own"), part("opponent")];

// The screen shake at the impact: jolts of random direction, each weaker than the last, then back
// in place.
const shake = () => [
  ...[14, 12, 6, 5].map((strength, jolt) => ({
    x: (jolt % 2 === 0 ? -1 : 1) * strength,
    y: gsap.utils.random(-strength, strength, 1) * 0.6,
    duration: 0.035,
  })),
  { x: 0, y: 0, duration: 0.03 },
];

// The whole Face-off overlay on a single timeline, paused: its time is the time since the pairing,
// set from the Duel's clock (never GSAP's own), so a seek lands anywhere. Transforms and opacity
// only; the diagonal cut is a static clip-path. `fillStake`: this User's Stake is shown and its bar
// fills in (not under reduced motion, where it shows full at once).
export const faceOffTimeline = ({ fillStake }: { fillStake: boolean }) => {
  const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  const marquee = { duration: COUNTDOWN_S + EXIT_S, ease: "power2.out" };

  timeline
    .addLabel("entrance", 0)
    .set(PANELS, { willChange: "transform" }, "entrance")
    .fromTo(part("marquee-forward"), { x: 0 }, { x: `-${MARQUEE_DRIFT}`, ...marquee }, "entrance")
    .fromTo(part("marquee-backward"), { x: `-${MARQUEE_DRIFT}` }, { x: 0, ...marquee }, "entrance")
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
    .to(part("stage"), { keyframes: shake() }, "impact")
    .fromTo(
      part("disc"),
      { scale: 0, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.27, ease: "back.out(2.2)" },
      "impact",
    )
    .fromTo(
      part("vs"),
      { scale: 2, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.17 },
      "impact",
    )
    .set(PANELS, { willChange: "auto" }, "impact")
    .addLabel("reveal", REVEAL_S)
    .fromTo(
      part("reveal"),
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.34 },
      "reveal",
    )
    .addLabel("cascade", CASCADE_S);

  // Both sides at once, each in its own order.
  for (const side of ["own", "opponent"]) {
    timeline.fromTo(
      `${part(side)} ${part("form-item")}`,
      { scale: 0.4, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.2,
        ease: "back.out(2.4)",
        stagger: CASCADE_STAGGER_S,
      },
      "cascade",
    );
  }

  if (fillStake) {
    timeline
      .addLabel("stake", STAKE_FILL_S)
      .fromTo(
        part("stake-gain"),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "expo.out" },
        "stake",
      );
  }

  timeline
    .addLabel("count", FACE_OFF_S)
    .to(part("vs"), { scale: 0.6, autoAlpha: 0, duration: 0.2 }, "count");

  for (const { mark, at } of DIGITS) {
    timeline
      .addLabel(digitName(mark), at)
      .fromTo(
        part(digitName(mark)),
        { scale: 2.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.2, ease: "power4.out" },
        at,
      )
      .to(part(digitName(mark)), { scale: 0.7, autoAlpha: 0, duration: 0.2 }, at + DIGIT_HOLD_S);
  }

  return timeline
    .addLabel("go", COUNTDOWN_S)
    .fromTo(
      part("go"),
      { scale: 2, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.15, ease: "power4.out" },
      "go",
    )
    .set(PANELS, { willChange: "transform" }, "go-=0.1")
    .addLabel("exit", COUNTDOWN_S)
    .to(part("own"), { yPercent: -105, duration: EXIT_S, ease: "power3.in" }, "exit")
    .to(part("opponent"), { yPercent: 105, duration: EXIT_S, ease: "power3.in" }, "exit")
    .to(part("mute"), { autoAlpha: 0, duration: 0.15 }, "exit")
    .to(part("disc"), { scale: 1.2, duration: 0.15 }, "exit")
    .to(part("disc"), { autoAlpha: 0, duration: 0.33, ease: "power2.in" }, "exit+=0.15");
};

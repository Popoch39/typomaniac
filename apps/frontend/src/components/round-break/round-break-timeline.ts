import { gsap } from "gsap";

// The board B · Tableau de série loops over 8 s; its times, in seconds from the start of the Round
// break. The GO lands on the start of the next Round: the timeline is anchored there.
export const ROUND_BREAK_TIMES = {
  // The three cards rise one after the other.
  rise: [0.08, 0.24, 0.4],
  riseFor: 0.48,
  // The card of the Round just played jumps and turns.
  jump: 0.88,
  turn: 0.96,
  // The winner's figure of the count jumps.
  count: 2.32,
  // The next card lifts and lights up, the caption comes.
  lift: 3.84,
  caption: 3.92,
  // Its number fades, then the 3-2-1 and the GO.
  numberOut: 4.8,
  countdown: [5.11, 5.67, 6.23],
  go: 6.79,
} as const;

// When the GO is whole, in seconds from the start of the Round break: the start of the next Round.
export const GO_AT = 6.86;

// The board's curve for the rise of the cards, and for the turn.
const RISE_EASE = "expo.out";

const TURN_EASE = "power2.inOut";

// Parts of the Round break, marked by `data-rb` on its elements.
const part = (name: string) => `[data-rb="${name}"]`;

// A figure of the 3-2-1 (or the GO) in the next card: in, held, out.
const countIn = (timeline: gsap.core.Timeline, target: string, at: number, reduced: boolean) => {
  timeline.fromTo(
    target,
    { opacity: 0, scale: reduced ? 1 : 1.6 },
    { opacity: 1, scale: 1, duration: 0.06, ease: "power2.out", lazy: false },
    at,
  );
  timeline.to(target, { scale: reduced ? 1 : 0.96, duration: 0.4, ease: "none" }, at + 0.06);
  timeline.to(
    target,
    { opacity: 0, scale: reduced ? 1 : 0.7, duration: 0.08, ease: "power2.in" },
    at + 0.46,
  );
};

// The Round break's timeline, paused, on the elements marked inside the current GSAP context's
// scope: the cards that rise, the one just played that turns, the count, the next card that
// lifts with its 3-2-1 and GO, and the caption. Without large movements under reduced motion: the
// same moments, in fades. `withHead`: the header fades in too (no band to come out of).
export const roundBreakTimeline = ({
  reduced,
  withHead,
}: {
  reduced: boolean;
  withHead: boolean;
}) => {
  const timeline = gsap.timeline({ paused: true });
  const t = ROUND_BREAK_TIMES;

  if (withHead) {
    timeline.fromTo(
      part("head"),
      { opacity: 0, y: reduced ? 0 : -16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", lazy: false },
      0.08,
    );
  }

  for (const [index, at] of t.rise.entries()) {
    timeline.fromTo(
      part(`slot-${index}`),
      { opacity: 0, y: reduced ? 0 : 70 },
      { opacity: 1, y: 0, duration: t.riseFor, ease: RISE_EASE, lazy: false },
      at,
    );
  }

  // The card just played: it jumps, turns past its back and settles.
  if (reduced) {
    // Its back faces the User from the start: the two faces cross-fade, without a turn.
    gsap.set(`${part("flip")} ${part("back")}`, { rotationY: 0 });
    timeline.fromTo(
      `${part("flip")} ${part("front")}`,
      { opacity: 1 },
      { opacity: 0, duration: 0.3, lazy: false },
      t.turn + 0.5,
    );
    timeline.fromTo(
      `${part("flip")} ${part("back")}`,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, lazy: false },
      t.turn + 0.5,
    );
  } else {
    timeline
      .fromTo(
        `${part("flip")} ${part("lift")}`,
        { y: 0, scale: 1 },
        { y: -36, scale: 1.05, duration: 0.4, ease: "power2.out", lazy: false },
        t.jump,
      )
      .to(`${part("flip")} ${part("lift")}`, { y: 4, scale: 1, duration: 0.16 }, 1.84)
      .to(`${part("flip")} ${part("lift")}`, { y: 0, duration: 0.24 }, 2)
      .fromTo(
        `${part("flip")} ${part("turn")}`,
        { rotationY: 0 },
        { rotationY: 196, duration: 0.8, ease: TURN_EASE, lazy: false },
        t.turn,
      )
      .to(`${part("flip")} ${part("turn")}`, { rotationY: 174, duration: 0.28 }, 1.76)
      .to(`${part("flip")} ${part("turn")}`, { rotationY: 180, duration: 0.2 }, 2.04);
  }

  // The winner's figure: the old one leaves upwards, the new one comes up and pops.
  timeline
    .fromTo(
      part("count-old"),
      { opacity: 1, yPercent: 0 },
      {
        opacity: 0,
        yPercent: reduced ? 0 : -100,
        duration: 0.24,
        ease: "power2.in",
        lazy: false,
      },
      t.count,
    )
    .fromTo(
      part("count-new"),
      { opacity: 0, yPercent: reduced ? 0 : 100, scale: 1 },
      {
        opacity: 1,
        yPercent: 0,
        scale: reduced ? 1 : 1.25,
        duration: 0.24,
        ease: "power2.out",
        lazy: false,
      },
      t.count,
    )
    .to(part("count-new"), { scale: 1, duration: 0.24, ease: "power2.out" }, t.count + 0.24);

  // The next card lifts and lights up; the caption comes.
  timeline
    .fromTo(
      `${part("next")} ${part("lift")}`,
      { y: 0, scale: 1 },
      {
        y: reduced ? 0 : -28,
        scale: reduced ? 1 : 1.06,
        duration: 0.48,
        ease: "power2.out",
        lazy: false,
      },
      t.lift,
    )
    .fromTo(
      `${part("next")} ${part("glow")}`,
      { opacity: 0 },
      { opacity: 1, duration: 0.48, ease: "power2.out", lazy: false },
      t.lift,
    )
    .fromTo(
      part("caption"),
      { opacity: 0, y: reduced ? 0 : 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", lazy: false },
      t.caption,
    )
    .fromTo(
      `${part("next")} ${part("number")}`,
      { opacity: 1, scale: 1 },
      { opacity: 0, scale: reduced ? 1 : 0.7, duration: 0.24, ease: "power2.in", lazy: false },
      t.numberOut,
    );

  for (const [index, at] of t.countdown.entries()) {
    countIn(timeline, part(`count-${3 - index}`), at, reduced);
  }

  timeline.fromTo(
    part("go"),
    { opacity: 0, scale: reduced ? 1 : 1.8 },
    { opacity: 1, scale: 1, duration: GO_AT - t.go, ease: "power2.out", lazy: false },
    t.go,
  );

  return timeline;
};

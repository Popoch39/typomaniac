import { gsap } from "gsap";

// The Intro's timelines, from board F · Ancrage × Faute de frappe of the canvas « Intro · Logo vers
// app shell » (`Ancrage-Frappe.dc.html`): its times, eases and sizes. Built on the elements given,
// never read from the page: the hook measures, then builds.

// The lockup's Logo, at its own size: 100.8 px, then 16.8 px of air before the word.
export const LOGO_PX = 100.8;

// At the start, the Logo is the boot Logo of index.html, to the pixel: 84 px at the centre.
export const BOOT_SCALE = 84 / LOGO_PX;

// The typing stops here, the caret hidden: the landing can start, or the caret waits.
export const WAIT_S = 2.62;

// Each letter of typomaniac, typed at its time: « typoman », then « iac » once the typo is gone.
const TYPED_AT = [0.95, 1.02, 1.08, 1.17, 1.23, 1.31, 1.37, 2.08, 2.15, 2.22];

// The typo « ai », typed after « typoman », then taken back, last letter first.
const TYPO = [
  { typed: 1.45, erased: 1.96 },
  { typed: 1.51, erased: 1.88 },
];

// The caret blinks off, then on again, twice while typing.
const BLINKS = [
  { off: 1.62, on: 1.76 },
  { off: 2.38, on: 2.5 },
];

// While the shell is not there, the caret blinks as it does on the board: off, then on for about
// half a second. Each blink ends off, where the Intro can go on.
const WAIT_OFF_S = 0.13;

const WAIT_BLINK_S = 0.63;

// The provisional end: the overlay fades out over the app.
const FADE_OUT_S = 0.4;

export type IntroTargets = {
  overlay: HTMLElement;
  lockup: HTMLElement;
  logo: HTMLElement;
  wave: SVGElement;
  letters: HTMLElement[];
  typo: HTMLElement[];
  caret: HTMLElement;
};

type TypingOptions = {
  // How far the Logo sits right of its place in the lockup at the start, for it to be at the
  // centre of the screen: half the lockup's width, less half the Logo's.
  shift: number;
};

// From the boot Logo to the waiting point: the Logo slides aside to its place in the lockup and
// takes its own size again, then the name is typed beside it with a typo that the wave flags and
// the caret takes back. The lockup moves left by as much as its Logo sits right: the Logo stays
// still until it slides.
export const typingTimeline = (
  { lockup, logo, wave, letters, typo, caret }: IntroTargets,
  { shift }: TypingOptions,
) => {
  const timeline = gsap.timeline();

  timeline
    .set(lockup, { x: -shift }, 0)
    .set(logo, { x: shift, scale: BOOT_SCALE, transformOrigin: "50% 50%" }, 0)
    .set([...letters, ...typo], { display: "none" }, 0)
    .set(caret, { display: "inline-block", opacity: 0 }, 0)
    .to(logo, { x: 0, scale: 1, duration: 0.6, ease: "expo.inOut" }, 0.35)
    .set(caret, { opacity: 1 }, 0.8);

  for (const [index, letter] of letters.entries()) {
    const at = TYPED_AT[index];

    if (typeof at !== "undefined") {
      timeline.set(letter, { display: "inline-block" }, at);
    }
  }

  for (const [index, letter] of typo.entries()) {
    const times = TYPO[index];

    if (typeof times !== "undefined") {
      timeline
        .set(letter, { display: "inline-block" }, times.typed)
        .set(letter, { display: "none" }, times.erased);
    }
  }

  for (const { off, on } of BLINKS) {
    timeline.set(caret, { opacity: 0 }, off).set(caret, { opacity: 1 }, on);
  }

  return (
    timeline
      // The wave shudders under the typo, on the scale of its own box (`--intro-wave`).
      .fromTo(
        wave,
        { "--intro-wave": 1 },
        { "--intro-wave": 1.9, duration: 0.1, yoyo: true, repeat: 3, ease: "sine.inOut" },
        1.53,
      )
      .set(caret, { display: "none" }, WAIT_S)
  );
};

// One blink of the caret while the shell is awaited: off, then on, then off again at its end.
export const waitingBlinkTimeline = ({ caret }: IntroTargets) =>
  gsap
    .timeline({ paused: true })
    .set(caret, { display: "inline-block" }, WAIT_OFF_S)
    .set(caret, { display: "none" }, WAIT_BLINK_S);

// Until the landing into the sidebar: the overlay fades out, the app as it is underneath.
export const fadeOutTimeline = ({ overlay }: IntroTargets) =>
  gsap.timeline().to(overlay, { opacity: 0, duration: FADE_OUT_S, ease: "power2.out" });

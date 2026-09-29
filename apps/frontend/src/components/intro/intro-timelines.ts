import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

import { DIVE_SCALE, type Landing } from "@/components/intro/landing-geometry";

gsap.registerPlugin(DrawSVGPlugin);

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

// With no sidebar to land in (the page's start failed), the overlay fades out over the error.
const FADE_OUT_S = 0.4;

// The landing's times are the board's, from its start: the waiting point.
const landingAt = (boardTime: number) => boardTime - WAIT_S;

// The landing's beats: the dive (after the breath), the sidebar growing, the brand taking over,
// then the cascade of the nav, of the page's parts and of the sidebar's lower part.
const DIVE_AT = landingAt(2.82);

const ANCHOR_AT = landingAt(3.55);

const RELAY_AT = landingAt(3.62);

const NAV_AT = landingAt(3.69);

const PARTS_AT = landingAt(3.74);

const LOWER_AT = landingAt(3.89);

// The dive, from the lockup's place to the brand's.
const DIVE_S = 0.8;

export type IntroTargets = {
  overlay: HTMLElement;
  lockup: HTMLElement;
  logo: HTMLElement;
  wave: SVGElement;
  letters: HTMLElement[];
  typo: HTMLElement[];
  caret: HTMLElement;
};

// The shell the lockup lands in: the sidebar and its brand, then what comes in after it.
export type ShellTargets = {
  sidebar: HTMLElement;
  brandLogo: SVGElement;
  brandWord: HTMLElement;
  brandWave: SVGElement;
  // The items of nav there for this User or Visitor: 3 or 6.
  nav: HTMLElement[];
  // The sidebar's lower part: the Friends online (or their Skeleton) when there, then its foot.
  lower: HTMLElement[];
  // The page's parts, in order: on the home page, settings, counter and stats, the Text's card,
  // Next, the keys; on any other, the page itself, one block.
  parts: HTMLElement[];
};

// The Logo slides aside, then the first letter is typed as it gets there.
const SLIDE_AT = 0.25;

const SLIDE_S = 0.7;

// A letter comes in, rising a little, or fades out before it is erased.
const LETTER_IN_S = 0.08;

const LETTER_RISE_PX = 6;

const LETTER_OUT_S = 0.05;

// The caret glides to its new place: shorter than the quickest keystroke (0.06 s), so a glide is
// over before the next starts.
const CARET_GLIDE_S = 0.06;

type TypingOptions = {
  // How far the Logo sits right of its place in the lockup at the start, for it to be at the
  // centre of the screen: half the lockup's width, less half the Logo's.
  shift: number;
  // The width of each letter, and of each letter of the typo: how far the caret moves as it is
  // typed or erased.
  letterWidths: number[];
  typoWidths: number[];
};

// A letter typed at `at`: it is laid out (the caret jumps right of it), then rises in as the caret
// glides from where it was to its new place.
const typeLetter = (
  timeline: gsap.core.Timeline,
  {
    letter,
    caret,
    width,
    at,
  }: { letter: HTMLElement; caret: HTMLElement; width: number; at: number },
) =>
  timeline
    .set(letter, { display: "inline-block" }, at)
    .fromTo(
      letter,
      { opacity: 0, y: LETTER_RISE_PX },
      { opacity: 1, y: 0, duration: LETTER_IN_S, ease: "power2.out", immediateRender: false },
      at,
    )
    .fromTo(
      caret,
      { x: -width },
      { x: 0, duration: CARET_GLIDE_S, ease: "power2.out", immediateRender: false },
      at,
    );

// A letter erased at `at`: it fades out, then leaves the layout (the caret jumps back) and the
// caret glides back from where it was.
const eraseLetter = (
  timeline: gsap.core.Timeline,
  {
    letter,
    caret,
    width,
    at,
  }: { letter: HTMLElement; caret: HTMLElement; width: number; at: number },
) =>
  timeline
    .to(letter, { opacity: 0, duration: LETTER_OUT_S, ease: "power1.in" }, at - LETTER_OUT_S)
    .set(letter, { display: "none" }, at)
    .fromTo(
      caret,
      { x: width },
      { x: 0, duration: CARET_GLIDE_S, ease: "power2.out", immediateRender: false },
      at,
    );

// From the boot Logo to the waiting point: the Logo slides aside to its place in the lockup and
// takes its own size again, then the name is typed beside it with a typo that the wave flags and
// the caret takes back, each letter rising in, the caret gliding. The lockup moves left by as much
// as its Logo sits right: the Logo stays still until it slides.
export const typingTimeline = (
  { lockup, logo, wave, letters, typo, caret }: IntroTargets,
  { shift, letterWidths, typoWidths }: TypingOptions,
) => {
  const timeline = gsap.timeline();

  timeline
    .set(lockup, { x: -shift }, 0)
    .set(logo, { x: shift, scale: BOOT_SCALE, transformOrigin: "50% 50%" }, 0)
    .set([...letters, ...typo], { display: "none" }, 0)
    .set(caret, { display: "inline-block", opacity: 0 }, 0)
    .to(logo, { x: 0, scale: 1, duration: SLIDE_S, ease: "power3.inOut" }, SLIDE_AT)
    .set(caret, { opacity: 1 }, 0.8);

  for (const [index, letter] of letters.entries()) {
    const at = TYPED_AT[index];

    if (typeof at !== "undefined") {
      typeLetter(timeline, { letter, caret, width: letterWidths[index] ?? 0, at });
    }
  }

  for (const [index, letter] of typo.entries()) {
    const times = TYPO[index];
    const width = typoWidths[index] ?? 0;

    if (typeof times !== "undefined") {
      typeLetter(timeline, { letter, caret, width, at: times.typed });
      eraseLetter(timeline, { letter, caret, width, at: times.erased });
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

// With no shell to land in: the overlay fades out, whatever the page shows underneath.
export const fadeOutTimeline = ({ overlay }: IntroTargets) =>
  gsap.timeline().to(overlay, { opacity: 0, duration: FADE_OUT_S, ease: "power2.out" });

// From the waiting point to the app: the lockup takes a breath and dives along an arc (x and y on
// their own eases) onto the sidebar's brand as its wave undraws; the sidebar grows out of the
// brand's footprint; the brand takes over from the lockup and its wave draws itself again; then
// the nav, the page's parts, the Friends online and the foot come in. As it starts, in the same
// frame, the overlay lets the ink through and the shell is hidden. The sidebar's own fade (a CSS
// transition on its opacity) is off meanwhile; reverting the timeline gives the shell back its
// classes alone.
export const landingTimeline = (
  { overlay, lockup, logo, wave }: IntroTargets,
  { sidebar, brandLogo, brandWord, brandWave, nav, lower, parts }: ShellTargets,
  { dive, clipFrom, clipTo }: Landing,
) => {
  const brand = [brandLogo, brandWord];

  return (
    gsap
      .timeline()
      .set(sidebar, { transition: "none", immediateRender: true }, 0)
      .set(overlay, { backgroundColor: "transparent", immediateRender: true }, 0)
      .set(sidebar, { autoAlpha: 0, clipPath: clipFrom, immediateRender: true }, 0)
      .set(brand, { opacity: 0, immediateRender: true }, 0)
      // The breath: the Logo gathers itself before the dive.
      .to(logo, { scale: 0.88, duration: 0.2, ease: "power2.in" }, 0)
      .to(logo, { scale: 1, duration: 0.6, ease: "back.out(2)" }, DIVE_AT)
      // The dive, the lockup scaled from its top left corner: will-change only as long as it lasts.
      .fromTo(
        wave,
        { drawSVG: "0% 100%" },
        { drawSVG: "100% 100%", duration: 0.35, ease: "power2.in" },
        DIVE_AT,
      )
      .set(lockup, { transformOrigin: "0 0", willChange: "transform" }, DIVE_AT)
      .to(lockup, { x: dive.x, duration: DIVE_S, ease: "power3.inOut" }, DIVE_AT)
      .to(lockup, { y: dive.y, duration: DIVE_S, ease: "power2.in" }, DIVE_AT)
      .to(lockup, { scale: DIVE_SCALE, duration: DIVE_S, ease: "power3.inOut" }, DIVE_AT)
      // The anchor: the sidebar grows out of the lockup as it lands.
      .set(sidebar, { autoAlpha: 1 }, ANCHOR_AT)
      .to(sidebar, { clipPath: clipTo, duration: 0.85, ease: "expo.out" }, ANCHOR_AT)
      // The relay: the brand in the lockup's place, its wave typed again.
      .set(lockup, { opacity: 0, willChange: "auto" }, RELAY_AT)
      .set(brand, { opacity: 1 }, RELAY_AT)
      .fromTo(
        brandWave,
        { drawSVG: "0% 0%" },
        { drawSVG: "0% 100%", duration: 0.5, ease: "power2.out" },
        RELAY_AT,
      )
      // The cascade.
      .fromTo(
        nav,
        { x: -14, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" },
        NAV_AT,
      )
      .fromTo(
        parts,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" },
        PARTS_AT,
      )
      .fromTo(
        lower,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" },
        LOWER_AT,
      )
  );
};

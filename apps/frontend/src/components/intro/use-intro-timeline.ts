import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { atReplaySpeed } from "@/components/intro-dev/intro-replay";
import {
  fadeOutTimeline,
  type IntroTargets,
  landingTimeline,
  LOGO_PX,
  type ShellTargets,
  typingTimeline,
  waitingBlinkTimeline,
} from "@/components/intro/intro-timelines";
import { landingGeometry, type LandingMeasures } from "@/components/intro/landing-geometry";
import { useIntroStore } from "@/stores/intro-store";

gsap.registerPlugin(useGSAP);

// The word's font: its width sets how far the Logo slides from 0.35 s on.
const LOCKUP_FONT = '800 56px "Onest Variable"';

// Resolves once the word's font is there (or failed to load: the Intro plays anyway, in the
// fallback). Without a FontFaceSet (happy-dom), at once.
const lockupFontLoaded = () =>
  typeof document.fonts === "undefined"
    ? Promise.resolve()
    : document.fonts.load(LOCKUP_FONT).then(
        () => undefined,
        () => undefined,
      );

const part = (name: string) => `[data-intro="${name}"]`;

// The parts of the overlay the timelines move, by their `data-intro`.
const targetsIn = (overlay: HTMLElement): IntroTargets | null => {
  const lockup = overlay.querySelector<HTMLElement>(part("lockup"));
  const logo = overlay.querySelector<HTMLElement>(part("logo"));
  const wave = overlay.querySelector<SVGElement>(part("wave"));
  const caret = overlay.querySelector<HTMLElement>(part("caret"));

  if (lockup === null || logo === null || wave === null || caret === null) {
    return null;
  }

  return {
    overlay,
    lockup,
    logo,
    wave,
    letters: Array.from(overlay.querySelectorAll<HTMLElement>(part("letter"))),
    typo: Array.from(overlay.querySelectorAll<HTMLElement>(part("typo"))),
    caret,
  };
};

const elementsIn = (root: ParentNode, name: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(part(name)));

// The page's parts, in order, when it marks them (the home page), else the page itself, one block.
const partsIn = (document: Document) => {
  const parts = elementsIn(document, "part");

  return parts.length > 0 ? parts : elementsIn(document, "page");
};

// The shell the lockup lands in, outside the overlay: the sidebar, its brand, its nav, its Friends
// online (or none) and its foot, the page's parts. None without a sidebar (the page's start
// failed, its error shown instead).
const shellIn = (document: Document): ShellTargets | null => {
  const sidebar = document.querySelector<HTMLElement>(part("sidebar"));
  const brand = sidebar?.querySelector<HTMLElement>(part("brand")) ?? null;
  const brandLogo = brand?.querySelector<SVGElement>('[data-logo="symbol"]') ?? null;
  const brandWave = brand?.querySelector<SVGElement>('[data-logo="wave"]') ?? null;
  const brandWord = brand?.querySelector<HTMLElement>(part("brand-word")) ?? null;
  const foot = sidebar?.querySelector<HTMLElement>(part("foot")) ?? null;

  if (
    sidebar === null ||
    brandLogo === null ||
    brandWave === null ||
    brandWord === null ||
    foot === null
  ) {
    return null;
  }

  return {
    sidebar,
    brandLogo,
    // The Rail writes the word for screen readers only: the Logo lands there alone.
    brandWord: sidebar.hasAttribute("data-rail") ? null : brandWord,
    brandWave,
    nav: elementsIn(sidebar, "nav"),
    lower: [...elementsIn(sidebar, "online"), foot],
    parts: partsIn(document),
  };
};

const boxOf = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();

  return { left, top, width, height };
};

// Every measure of the landing, read at once on the real sidebar as it starts, before anything
// is written. The lockup's box before its transform: the overlay, fixed, is the window.
const measure = (
  { lockup, logo }: IntroTargets,
  { sidebar, brandLogo, brandWord }: ShellTargets,
): LandingMeasures => ({
  lockup: { left: lockup.offsetLeft, top: lockup.offsetTop },
  logoTop: logo.offsetTop,
  sidebar: boxOf(sidebar),
  brandLogo: boxOf(brandLogo),
  brandWord: brandWord === null ? null : boxOf(brandWord),
});

// What the typing needs of the word's layout: each letter's width, the typo's too, for the caret
// to glide by as much; and how far right of its place in the lockup the Logo starts, for it to be
// at the centre of the screen: half the typed lockup's width, less half the Logo. The letters, the
// typo with them, are shown to be measured (one read), then hidden again in the same task: never
// painted. Side by side in a flex row, each keeps its own width.
const typingLayout = ({ letters, typo }: IntroTargets) => {
  gsap.set([...letters, ...typo], { display: "inline-block" });

  const letterWidths = letters.map((letter) => letter.offsetWidth);
  const typoWidths = typo.map((letter) => letter.offsetWidth);
  const first = letters.at(0);
  const wordWidth = letterWidths.reduce((sum, width) => sum + width, 0);
  const width = typeof first === "undefined" ? LOGO_PX : first.offsetLeft + wordWidth;

  gsap.set([...letters, ...typo], { display: "none" });

  return { shift: width / 2 - LOGO_PX / 2, letterWidths, typoWidths };
};

const end = () => useIntroStore.getState().end();

// In a dev build, an Intro replayed from /dev/intro plays at its chosen speed (see intro-replay).
const atSpeed = import.meta.env.DEV ? atReplaySpeed : (timeline: gsap.core.Timeline) => timeline;

// The end of the Intro, once the shell is there, right where `before` (the typing, or the last
// blink) ended: on the frame that passed it, the landing starts that much in, never a frame late.
// Measured on the real sidebar, then the landing into it. A resize as it lands would move the
// sidebar: the Intro jumps to its end. With no sidebar to land in (the page's start failed), the
// overlay fades out over the error.
const finish = (targets: IntroTargets, before: gsap.core.Timeline) => {
  const shell = shellIn(targets.overlay.ownerDocument);

  if (shell === null) {
    atSpeed(fadeOutTimeline(targets)).eventCallback("onComplete", end);

    return;
  }

  const landing = atSpeed(landingTimeline(targets, shell, landingGeometry(measure(targets, shell))))
    .startTime(before.endTime())
    .eventCallback("onComplete", end);

  const jumpToEnd = () => landing.progress(1);

  window.addEventListener("resize", jumpToEnd);

  return () => window.removeEventListener("resize", jumpToEnd);
};

// The typing, then a blink of the caret as long as the shell is awaited, then the end, built in
// `context` when it comes: the context reverts them all, the shell's inline styles with them.
const play = (targets: IntroTargets, context: gsap.Context) => {
  const typing = atSpeed(typingTimeline(targets, typingLayout(targets)));
  const blink = atSpeed(waitingBlinkTimeline(targets));

  // At the waiting point, and at the end of each blink: on to the end once the shell is there,
  // else one more blink.
  const goOn = (before: gsap.core.Timeline) => {
    if (useIntroStore.getState().shellReady) {
      context.add(() => finish(targets, before));
    } else {
      blink.restart();
    }
  };

  typing.eventCallback("onComplete", () => goOn(typing));
  blink.eventCallback("onComplete", () => goOn(blink));
};

// Plays the Intro inside `scope`, from the boot Logo, on GSAP's clock: once the word's font is
// there, the typing; then, until the home page is mounted, the caret blinks, the Intro going on at
// the end of a blink; then the lockup lands in the sidebar and the app comes in, and the Intro
// ends. Under reduced motion (the preference changed since the start), it ends at once.
// Everything is reverted on unmount: the overlay's, and the shell's inline styles.
export const useIntroTimeline = (scope: RefObject<HTMLDivElement | null>) => {
  useGSAP(
    () => {
      const overlay = scope.current;
      const targets = overlay === null ? null : targetsIn(overlay);

      if (targets === null) {
        return;
      }

      const media = gsap.matchMedia();

      media.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduce) {
            end();

            return;
          }

          let live = true;

          void lockupFontLoaded().then(() => {
            if (live) {
              context.add(() => play(targets, context));
            }
          });

          return () => {
            live = false;
          };
        },
      );

      return () => media.revert();
    },
    { scope },
  );
};

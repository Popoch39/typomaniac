import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { atReplaySpeed } from "@/components/intro-dev/intro-replay";
import {
  fadeOutTimeline,
  type IntroTargets,
  LOGO_PX,
  typingTimeline,
  waitingBlinkTimeline,
} from "@/components/intro/intro-timelines";
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

// How far right of its place in the lockup the Logo starts, for it to be at the centre of the
// screen: half the typed lockup's width, less half the Logo. The letters are shown to be measured
// (one read), then hidden again in the same task: never painted.
const logoShift = ({ letters }: IntroTargets) => {
  gsap.set(letters, { display: "inline-block" });

  const last = letters.at(-1);
  const width = typeof last === "undefined" ? LOGO_PX : last.offsetLeft + last.offsetWidth;

  gsap.set(letters, { display: "none" });

  return width / 2 - LOGO_PX / 2;
};

const end = () => useIntroStore.getState().end();

// In a dev build, an Intro replayed from /dev/intro plays at its chosen speed (see intro-replay).
const atSpeed = import.meta.env.DEV ? atReplaySpeed : (timeline: gsap.core.Timeline) => timeline;

// The three phases, built at once so that the context reverts them all: the typing, then a blink
// of the caret as long as the shell is awaited, then the end.
const play = (targets: IntroTargets) => {
  const typing = atSpeed(typingTimeline(targets, { shift: logoShift(targets) }));
  const blink = atSpeed(waitingBlinkTimeline(targets));
  const fadeOut = atSpeed(fadeOutTimeline(targets)).pause().eventCallback("onComplete", end);

  // At the waiting point, and at the end of each blink: on to the end once the shell is there,
  // else one more blink.
  const goOn = () => {
    if (useIntroStore.getState().shellReady) {
      fadeOut.play();
    } else {
      blink.restart();
    }
  };

  typing.eventCallback("onComplete", goOn);
  blink.eventCallback("onComplete", goOn);
};

// Plays the Intro inside `scope`, from the boot Logo, on GSAP's clock: once the word's font is
// there, the typing; then, until the home page is mounted, the caret blinks, the Intro going on at
// the end of a blink; then the overlay fades out, and the Intro ends. Under reduced motion (the
// preference changed since the start), it ends at once. Everything is reverted on unmount.
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
              context.add(() => play(targets));
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

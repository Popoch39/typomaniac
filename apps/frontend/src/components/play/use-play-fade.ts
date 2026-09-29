import { useGSAP } from "@gsap/react";
import { useRouterState } from "@tanstack/react-router";
import { gsap } from "gsap";
import { type RefObject, useState } from "react";

gsap.registerPlugin(useGSAP);

// The fade's length, in seconds, and how far the page slides up as it comes in, in pixels.
export const PLAY_FADE_SECONDS = 0.45;

const PLAY_FADE_RISE = 10;

// The page in `pageRef` fades in, rising a little, when the User comes from `from` (Jouer's cards
// and the Run, one to the other); every other arrival is instant, and so is this one under reduced
// motion. The page the router shows until this one is mounted is where the User comes from. Its
// start is written as it mounts, never a frame later (not lazy): the page never flashes in whole.
// Only opacity and a transform, gone once over.
export const usePlayFade = (pageRef: RefObject<HTMLElement | null>, from: string) => {
  const shownBefore = useRouterState({ select: (state) => state.resolvedLocation?.pathname });
  const [fades] = useState(() => shownBefore === from);

  useGSAP(
    () => {
      const page = pageRef.current;

      if (!fades || page === null) {
        return;
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          page,
          { opacity: 0, y: PLAY_FADE_RISE },
          {
            opacity: 1,
            y: 0,
            duration: PLAY_FADE_SECONDS,
            ease: "power2.out",
            lazy: false,
            clearProps: "opacity,transform",
          },
        );
      });
    },
    { scope: pageRef },
  );
};

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { type RefObject, useLayoutEffect, useRef } from "react";

gsap.registerPlugin(useGSAP, CustomEase);

// How long the split takes to slide to a new Lead, in seconds, and on which curve.
const SLIDE = 0.42;

const SLIDE_EASE = CustomEase.create("duel-band-slide", "0.2,0.8,0.2,1");

// Moves the split: sliding, or at once when `jump`.
type SplitMover = (split: number, jump: boolean) => void;

// Writes the band's split, in % of its width, to its `--split`, never through a re-render: set at
// once at first, and again whenever the motion preference changes, then sliding to each new
// Lead, at once under reduced motion.
export const useBandSplit = (bandRef: RefObject<HTMLElement | null>, split: number) => {
  const mover = useRef<SplitMover | null>(null);
  // The split last asked for; null until the first Lead is placed.
  const latest = useRef<number | null>(null);

  useGSAP(
    () => {
      const band = bandRef.current;

      if (band === null) {
        return;
      }

      gsap.matchMedia().add(
        {
          slide: "(prefers-reduced-motion: no-preference)",
          still: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const to = gsap.quickTo(band, "--split", {
            duration: context.conditions?.slide === true ? SLIDE : 0,
            ease: SLIDE_EASE,
          });

          mover.current = (value, jump) => {
            if (jump) {
              to(value, value);
            } else {
              to(value);
            }
          };

          mover.current(latest.current ?? split, true);

          return () => {
            mover.current = null;
          };
        },
      );
    },
    { scope: bandRef },
  );

  useLayoutEffect(() => {
    // On the first Lead, the split is already there: nothing to slide.
    mover.current?.(split, latest.current === null);
    latest.current = split;
  }, [split]);
};

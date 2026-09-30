import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

import { ACCENT_SECONDS } from "@/components/search-morph/search-morph-timing";

gsap.registerPlugin(useGSAP);

// The accent of the search carrying a Match proposal, in `accentRef` (the pill's fill, the card's
// outline), fades in as it comes. Written as it mounts; at once under reduced motion.
export const useAccentFade = (accentRef: RefObject<HTMLElement | null>) => {
  useGSAP(
    () => {
      const accent = accentRef.current;

      if (accent === null) {
        return;
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          accent,
          { opacity: 0 },
          {
            opacity: 1,
            duration: ACCENT_SECONDS,
            ease: "power1.out",
            lazy: false,
            clearProps: "opacity",
          },
        );
      });
    },
    { scope: accentRef },
  );
};

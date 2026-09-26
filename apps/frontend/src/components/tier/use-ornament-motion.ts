import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP);

// The parts of one Ornament that move, by their data attribute. Queried rather than targeted by
// selector: below Or there is nothing to move, and GSAP would warn about a missing target.
const GLOW_SELECTOR = "[data-ornament-glow]";

const RAYS_SELECTOR = "[data-ornament-rays]";

// The glow of the Ornament inside `scope` breathes and the Maniac's rays turn slowly, forever,
// in opacity and transform only. Nothing is created under reduced motion; all is killed on
// unmount.
export const useOrnamentMotion = (scope: RefObject<SVGGElement | null>) => {
  useGSAP(
    () => {
      const glows = scope.current?.querySelectorAll(GLOW_SELECTOR) ?? [];
      const rays = scope.current?.querySelectorAll(RAYS_SELECTOR) ?? [];

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        if (glows.length > 0) {
          gsap.to(glows, {
            opacity: 0.55,
            duration: 2.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        }

        if (rays.length > 0) {
          gsap.to(rays, {
            rotation: 360,
            svgOrigin: "60 60",
            duration: 60,
            ease: "none",
            repeat: -1,
          });
        }
      });
    },
    { scope },
  );
};

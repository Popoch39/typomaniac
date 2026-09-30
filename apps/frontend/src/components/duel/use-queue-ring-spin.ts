import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP);

// A turn of the arc, and of the halo the other way, in seconds.
const ARC_TURN_SECONDS = 1.2;

const HALO_TURN_SECONDS = 14;

// The search's ring turns: its arc (`data-ring-arc`) fast, its dotted halo (`data-ring-halo`) slowly
// the other way, as long as it is shown. Still under reduced motion.
export const useQueueRingSpin = (ringRef: RefObject<HTMLElement | null>) => {
  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const turn = { ease: "none", repeat: -1 };

        gsap.to("[data-ring-arc]", { ...turn, rotation: 360, duration: ARC_TURN_SECONDS });
        gsap.to("[data-ring-halo]", { ...turn, rotation: -360, duration: HALO_TURN_SECONDS });
      });
    },
    { scope: ringRef },
  );
};

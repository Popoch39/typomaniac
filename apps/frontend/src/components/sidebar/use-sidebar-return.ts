import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

import { FOLD_SECONDS } from "@/components/sidebar/use-sidebar-fold";

gsap.registerPlugin(useGSAP);

// Out of the Duel's scene (the Duel end, mostly), the sidebar hidden during the Duel comes back
// sliding in: its width grows from nothing to its own, as the Rail unfolds after a Solo Run, its
// content clipped meanwhile, no inline style left. At once under reduced motion.
export const useSidebarReturn = (sidebarRef: RefObject<HTMLElement | null>, hidden: boolean) => {
  // Whether the last render hid it.
  const wasHidden = useRef(hidden);

  useGSAP(
    () => {
      const sidebar = sidebarRef.current;
      const returns = wasHidden.current && !hidden;

      wasHidden.current = hidden;

      if (sidebar === null || !returns) {
        return;
      }

      const width = sidebar.offsetWidth;

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          sidebar,
          { width: 0, overflow: "hidden" },
          {
            width,
            duration: FOLD_SECONDS,
            ease: "power3.inOut",
            lazy: false,
            clearProps: "width,overflow",
          },
        );
      });
    },
    { dependencies: [hidden], scope: sidebarRef },
  );
};

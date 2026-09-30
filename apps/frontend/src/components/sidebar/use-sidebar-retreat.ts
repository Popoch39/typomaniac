import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

gsap.registerPlugin(useGSAP);

// How long the sidebar takes to leave or come back, in seconds.
export const RETREAT_SECONDS = 0.3;

// The gap between the sidebar and the page, in pixels, read from the frame (AppFrameLayout's
// `gap-3`): given to the page with the sidebar's width.
const frameGapOf = (sidebar: HTMLElement) => {
  const frame = sidebar.parentElement;
  const gap = frame === null ? 0 : Number.parseFloat(getComputedStyle(frame).columnGap);

  return Number.isNaN(gap) ? 0 : gap;
};

// While a Solo Run is typed, the sidebar leaves the window: it slides out left and fades as its
// slot in the frame closes (a negative margin, its own content never reflowed), then is hidden;
// the page takes the whole width. At the Result it comes back the same way, from wherever it is,
// and leaves no inline style. At once under reduced motion, and on the first render: the sidebar
// starts where it is, gone if a Run is typed already.
export const useSidebarRetreat = (
  sidebarRef: RefObject<HTMLElement | null>,
  retreated: boolean,
) => {
  const placed = useRef(false);

  useGSAP(
    () => {
      const sidebar = sidebarRef.current;
      const first = !placed.current;

      placed.current = true;

      if (sidebar === null || (first && !retreated)) {
        return;
      }

      gsap.matchMedia().add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const duration = !first && context.conditions?.motion ? RETREAT_SECONDS : 0;
          const slot = sidebar.offsetWidth + frameGapOf(sidebar);

          gsap.to(
            sidebar,
            retreated
              ? {
                  x: -slot,
                  // In pixels: GSAP reads no unit from a margin the stylesheet leaves unset.
                  marginRight: `${-slot}px`,
                  autoAlpha: 0,
                  duration,
                  ease: "power3.inOut",
                }
              : {
                  x: 0,
                  marginRight: 0,
                  autoAlpha: 1,
                  duration,
                  ease: "power3.out",
                  clearProps: "transform,marginRight,opacity,visibility",
                },
          );
        },
      );
    },
    { dependencies: [retreated], scope: sidebarRef },
  );
};

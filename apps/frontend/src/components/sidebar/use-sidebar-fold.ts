import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

gsap.registerPlugin(useGSAP);

// How long the sidebar takes to fold into its Rail or unfold, in seconds.
export const FOLD_SECONDS = 0.3;

// A fold: its media query, and its tween once written (none under reduced motion).
type Fold = { mm: gsap.MatchMedia; tween: gsap.core.Tween | null };

// As a Solo Run's typing starts, the sidebar folds into its Rail (its labels gone, its icons left)
// and its width shrinks to the Rail's; at the Result it unfolds back. From the width it has, even
// halfway, and no inline style left. A resize across 1440 px switches at once (ADR 0013), and so
// does everything under reduced motion or on the first render.
export const useSidebarFold = (
  sidebarRef: RefObject<HTMLElement | null>,
  rail: boolean,
  typing: boolean,
) => {
  // What the last render laid out: the sidebar's width, and whether it was a Rail and a Run typed.
  const last = useRef<{ width: number; rail: boolean; typing: boolean } | null>(null);
  // The last fold: reverted as the next one starts.
  const fold = useRef<Fold | null>(null);

  useGSAP(
    () => {
      const sidebar = sidebarRef.current;

      if (sidebar === null) {
        return;
      }

      // Halfway through a fold, its width is the one written inline.
      const from = fold.current?.tween?.isActive() ? sidebar.offsetWidth : last.current?.width;

      fold.current?.mm.revert();
      fold.current = null;

      const to = sidebar.offsetWidth;

      const folds =
        last.current !== null && last.current.typing !== typing && last.current.rail !== rail;

      last.current = { width: to, rail, typing };

      if (!folds || from === undefined) {
        return;
      }

      const current: Fold = {
        mm: gsap.matchMedia(),
        tween: null,
      };

      fold.current = current;
      current.mm.add("(prefers-reduced-motion: no-preference)", () => {
        current.tween = gsap.fromTo(
          sidebar,
          { width: from },
          {
            width: to,
            duration: FOLD_SECONDS,
            ease: "power3.inOut",
            lazy: false,
            clearProps: "width",
          },
        );
      });
    },
    { dependencies: [rail, typing], scope: sidebarRef },
  );
};

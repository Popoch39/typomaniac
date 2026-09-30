import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import type { RefObject } from "react";

import {
  layGhosts,
  lastSearchForm,
  MORPH_PROPS,
  type SearchForm,
} from "@/components/search-morph/search-form";
import {
  CONTENT_IN_AT,
  CONTENT_IN_SECONDS,
  CONTENT_OUT_SECONDS,
  MORPH_EASE,
  MORPH_SECONDS,
} from "@/components/search-morph/search-morph-timing";

gsap.registerPlugin(useGSAP, Flip);

// From the form the search had to this one: what left with it fades out where it was, the surface
// slides and resizes to its place, its shadow and corners with it, the ring follows in the same
// move, then the content fades in. Once over, nothing is left of it: no copy, no inline style.
const morph = (root: HTMLElement, from: SearchForm) => {
  const surface = root.querySelector<HTMLElement>("[data-search-surface]");
  const ring = from.ringed ? root.querySelector<HTMLElement>("[data-search-ring]") : null;
  const content = [...root.children].filter((child) => child !== surface && child !== ring);
  const moved = [surface, ring].filter((element) => element !== null);

  // What leaves may still be on the page, the router showing it until the next one is ready: its
  // copies take its place at once.
  const leaving = [...document.querySelectorAll<HTMLElement>("[data-search-leaves]")].filter(
    (element) => !element.contains(root) && !root.contains(element),
  );

  if (leaving.length > 0) {
    gsap.set(leaving, { autoAlpha: 0 });
  }

  const removeGhosts = layGhosts(from.ghosts);

  const timeline = gsap.timeline({
    onComplete: () => {
      removeGhosts();
      gsap.set([...moved, ...content], { clearProps: "all" });
    },
  });

  if (from.ghosts.length > 0) {
    timeline.to(
      from.ghosts.map((ghost) => ghost.node),
      { opacity: 0, duration: CONTENT_OUT_SECONDS, ease: "none", onComplete: removeGhosts },
      0,
    );
  }

  // Each laid where its match (same `data-flip-id`) was, then back to its own place. Fitted onto
  // the recorded state, never swapped with the element it was taken from, which the router may
  // still show.
  const move = {
    duration: MORPH_SECONDS,
    ease: MORPH_EASE,
    runBackwards: true,
    immediateRender: true,
    lazy: false,
  };

  const fits = [
    surface === null ? null : Flip.fit(surface, from.state, { ...move, props: MORPH_PROPS }),
    ring === null ? null : Flip.fit(ring, from.state, { ...move, scale: true }),
  ];

  for (const fit of fits) {
    // With a duration, a fit is a tween (none when its match is missing).
    if (fit instanceof gsap.core.Tween) {
      timeline.add(fit, 0);
    }
  }

  timeline.fromTo(
    content,
    { opacity: 0 },
    {
      opacity: 1,
      duration: CONTENT_IN_SECONDS,
      ease: "power1.out",
      immediateRender: true,
      lazy: false,
    },
    CONTENT_IN_AT,
  );

  return removeGhosts;
};

// The search's form in `rootRef`, if marked so (`data-search-form`; its surface
// `data-search-surface`, its ring `data-search-ring`, its content the rest), comes from the form
// it had, if it just had another: the Ranked card, the search's card or the Queue pill. Written as
// it mounts, never a frame later; at once under reduced motion, and on any other arrival.
export const useSearchMorph = (rootRef: RefObject<HTMLElement | null>) => {
  useGSAP(
    () => {
      const root = rootRef.current;
      const from = root?.matches("[data-search-form]") ? lastSearchForm(root) : null;

      if (root === null || from === null) {
        return;
      }

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => morph(root, from));
    },
    { scope: rootRef },
  );
};

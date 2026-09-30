import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useRef } from "react";

import { bandMorphFor } from "@/components/duel-end/band-morph";
import { fadeBandGhost, morphBand } from "@/components/duel-end/band-morph-timeline";

gsap.registerPlugin(useGSAP);

const MOVING = "(prefers-reduced-motion: no-preference)";

const STILL = "(prefers-reduced-motion: reduce)";

// How far a block rises as it comes in, in pixels.
const RISE = 24;

// A block fading in as it rises, nothing of it left once in.
const FADED_OUT = { opacity: 0, y: RISE };

const FADED_IN = { opacity: 1, y: 0, clearProps: "opacity,transform" };

// A stamp set down: large and faint, then pressed onto its place.
const LIFTED = { opacity: 0, scale: 1.6 };

const PRESSED = { opacity: 1, scale: 1, ease: "back.out(2)", clearProps: "opacity,transform" };

// How long after one Record's tile the next one comes in, in seconds: the last in at 1.1 s.
const TILE_STEP = 0.05;

// The entrance of the Duel end, about 1.4 s, each block by its `data-entrance` (the stamps by
// `data-record-stamp`, the TP moved by `data-tp-part`): the outcome fades in, the band comes and
// its slant slides from the middle to the User's share (`--share-in`, 0 to 1), its « Record »
// stamped; or, when the HUD's band was recorded as the Duel ended, the band grows and slides out
// of it instead, its slant from the Lead's split (morphBand), the HUD's figures faded out; the rank card, its TP popping and the part moved filling up; the Records' tiles one
// after the other, « Nouveau record » stamped; the tale of the tape's lines, then the chart and
// the buttons. Only opacity, transforms and that variable, gone once in; every start is written
// as it mounts (not lazy), so no block flashes in whole. Built paused, it plays once nothing
// `holds` it (a Tier-up over the screen, which stays hidden under it). Under reduced motion,
// nothing moves: the Duel end is there at once, the HUD's figures fading out over it. The buttons answer all along: only seen fading.
export const useDuelEndEntrance = (screenRef: RefObject<HTMLElement | null>, holds: boolean) => {
  const entrance = useRef<gsap.core.Timeline | null>(null);
  // Whether it is held right now, read when the timeline is built again.
  const holding = useRef(holds);

  useGSAP(
    () => {
      const screen = screenRef.current;

      if (screen === null) {
        return;
      }

      const morph = bandMorphFor(screen);

      gsap.matchMedia().add(STILL, () => (morph === null ? undefined : fadeBandGhost(morph)));

      gsap.matchMedia().add(MOVING, () => {
        const timeline = gsap.timeline({
          paused: true,
          defaults: { ease: "power2.out", lazy: false, immediateRender: true },
        });

        // A missing block (no rank, no Records, no chart) leaves its place empty.
        const enter = (selector: string, from: gsap.TweenVars, to: gsap.TweenVars, at: number) => {
          const blocks = gsap.utils.toArray<HTMLElement>(selector, screen);

          if (blocks.length > 0) {
            timeline.fromTo(blocks, from, to, at);
          }
        };

        const fadeIn = (selector: string, duration: number, at: number) =>
          enter(selector, FADED_OUT, { ...FADED_IN, duration }, at);

        fadeIn("[data-entrance=outcome]", 0.35, 0);

        // From the HUD's band, the band comes out of it; otherwise it comes in as a block.
        const unmorph = morph === null ? null : morphBand(timeline, screen, morph);

        if (unmorph === null) {
          fadeIn("[data-entrance=band]", 0.35, 0.2);
          enter(
            "[data-entrance=band]",
            { "--share-in": 0 },
            { "--share-in": 1, duration: 0.6, ease: "power3.out", clearProps: "--share-in" },
            0.2,
          );
        }

        enter(
          "[data-entrance=band] [data-record-stamp]",
          LIFTED,
          { ...PRESSED, duration: 0.25 },
          0.7,
        );
        fadeIn("[data-entrance=rank]", 0.35, 0.5);
        enter(
          "[data-entrance=tp]",
          { ...LIFTED, y: 8, scale: 0.8 },
          { ...PRESSED, y: 0, duration: 0.4 },
          0.6,
        );
        enter(
          "[data-tp-part=gained], [data-tp-part=lost]",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.4, clearProps: "transform" },
          0.6,
        );
        // The tiles one after the other, each stamped as it lands.
        gsap.utils.toArray<HTMLElement>("[data-entrance=tile]", screen).forEach((tile, index) => {
          const at = 0.8 + index * TILE_STEP;

          timeline.fromTo(tile, FADED_OUT, { ...FADED_IN, duration: 0.2 }, at);

          const stamps = gsap.utils.toArray<HTMLElement>("[data-record-stamp]", tile);

          if (stamps.length > 0) {
            timeline.fromTo(stamps, LIFTED, { ...PRESSED, duration: 0.1 }, at + 0.1);
          }
        });
        enter(
          "[data-entrance=tape] tbody tr",
          FADED_OUT,
          { ...FADED_IN, duration: 0.25, stagger: { amount: 0.15 } },
          0.9,
        );
        fadeIn("[data-entrance=chart]", 0.3, 1);
        fadeIn("[data-entrance=actions]", 0.3, 1.1);

        entrance.current = timeline;

        // Built again as the motion preference comes back: nothing holds it any more, it plays.
        if (!holding.current) {
          timeline.play();
        }

        return () => {
          entrance.current = null;
          unmorph?.();
        };
      });
    },
    { scope: screenRef },
  );

  useGSAP(
    () => {
      holding.current = holds;

      if (!holds) {
        entrance.current?.play();
      }
    },
    { dependencies: [holds], scope: screenRef },
  );
};

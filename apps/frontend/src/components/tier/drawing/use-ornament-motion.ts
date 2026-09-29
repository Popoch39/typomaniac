import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { type RefObject, useId } from "react";

import { SHEEN_TRAVEL, SPARK_PEAK } from "@/components/aura/aura-paint";
import { useAuraRuntime } from "@/components/aura/aura-runtime-context";
import {
  SHEEN_REST,
  SHEEN_SWEEP,
  sheenDelay,
  SPARK_REST,
  SPARK_STAGGER,
  SPARK_TWINKLE,
  sparkDelay,
} from "@/components/aura/aura-timing";

gsap.registerPlugin(useGSAP);

// The parts of one Ornament that move, by their data attribute. Queried rather than targeted by
// selector: below Gold there is nothing to move, and GSAP would warn about a missing target.
const GLOW_SELECTOR = "[data-ornament-glow]";

const RAYS_SELECTOR = "[data-ornament-rays]";

const SHEEN_SELECTOR = "[data-aura-sheen]";

const SPARK_SELECTOR = "[data-aura-spark]";

// The Ornament inside `scope` moves forever, in opacity and transforms only: its glow breathes,
// the Maniac's rays turn, its sheen sweeps the metal now and then (first after a delay of its
// own, so neighbours never shine together) and its sparks twinkle (offset per instance too). It
// only moves while on screen
// in a shown tab: the same tweens are paused, then resumed. Nothing is created under reduced
// motion; all is killed, and nothing watched any more, on unmount.
export const useOrnamentMotion = (scope: RefObject<SVGGElement | null>) => {
  const runtime = useAuraRuntime();
  const instance = useId();

  useGSAP(
    () => {
      const root = scope.current;

      if (root === null) {
        return;
      }

      const glows = root.querySelectorAll(GLOW_SELECTOR);
      const rays = root.querySelectorAll(RAYS_SELECTOR);
      const sheens = root.querySelectorAll(SHEEN_SELECTOR);
      const sparks = root.querySelectorAll(SPARK_SELECTOR);
      const tweens = new Set<gsap.core.Tween>();
      let onScreen = false;
      let tabShown = false;

      const seen = () => onScreen && tabShown;

      // Paused while unseen, playing while seen.
      const syncPaused = () => {
        for (const tween of tweens) {
          tween.paused(!seen());
        }
      };

      // Watched before the tweens exist: those of an Ornament already seen start as they are.
      const stopScreen = runtime.watchScreen(root, (visible) => {
        onScreen = visible;
        syncPaused();
      });

      const stopTab = runtime.watchTab((shown) => {
        tabShown = shown;
        syncPaused();
      });

      const loop = (targets: NodeListOf<Element>, vars: gsap.TweenVars) => {
        if (targets.length > 0) {
          tweens.add(gsap.to(targets, { repeat: -1, ...vars }));
        }
      };

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        loop(glows, { opacity: 0.55, duration: 2.4, ease: "sine.inOut", yoyo: true });
        loop(rays, { rotation: 360, svgOrigin: "60 60", duration: 60, ease: "none" });
        loop(sheens, {
          x: SHEEN_TRAVEL,
          duration: SHEEN_SWEEP,
          ease: "power2.inOut",
          repeatDelay: SHEEN_REST,
          delay: sheenDelay(instance),
        });

        // Each spark lights up as it grows around its centre, then shrinks back unlit, one after
        // the other, each on its own loop.
        if (sparks.length > 0) {
          tweens.add(
            gsap.to(sparks, {
              scale: SPARK_PEAK,
              opacity: 1,
              svgOrigin: "0 0",
              duration: SPARK_TWINKLE,
              ease: "sine.inOut",
              delay: sparkDelay(instance),
              stagger: { each: SPARK_STAGGER, repeat: -1, yoyo: true, repeatDelay: SPARK_REST },
            }),
          );
        }

        // Still if the Ornament is not seen yet; left untouched, never paused then resumed, if it is.
        syncPaused();

        return () => tweens.clear();
      });

      return () => {
        stopScreen();
        stopTab();
      };
    },
    { scope },
  );
};

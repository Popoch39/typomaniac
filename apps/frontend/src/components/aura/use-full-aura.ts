import { type RefObject, useEffect, useEffectEvent } from "react";
import type { Tier } from "ranked";

import { useAuraRuntime } from "@/components/aura/aura-runtime-context";
import { reducedMotion, useForcedReducedMotion } from "@/components/motion/reduced-motion-context";
import type { FullAuraClaim } from "@/lib/aura-runtime";

// Asks the runtime for a full Aura of `tier` on `canvas`, loading the runtime first if need be:
// drawn only while on screen in a shown tab, a single still image under reduced motion (preferred,
// or forced by a dev page). Calls
// `onRefused` if the runtime refuses it (no WebGL2, too many shown) or loses it (context lost):
// the light Aura then takes its place. Released, and nothing watched any more, on unmount.
export const useFullAura = (
  canvas: RefObject<HTMLCanvasElement | null>,
  tier: Tier,
  onRefused: () => void,
) => {
  const runtime = useAuraRuntime();
  const forced = useForcedReducedMotion();
  const refuse = useEffectEvent(onRefused);

  useEffect(() => {
    const element = canvas.current;

    if (element === null) {
      return;
    }

    let claim: FullAuraClaim | null = null;
    let unmounted = false;
    let onScreen = false;
    let tabShown = false;

    const syncSeen = () => claim?.see(onScreen && tabShown);

    const stopScreen = runtime.watchScreen(element, (visible) => {
      onScreen = visible;
      syncSeen();
    });

    const stopTab = runtime.watchTab((shown) => {
      tabShown = shown;
      syncSeen();
    });

    void runtime.loadFullAura().then((full) => {
      if (unmounted) {
        return;
      }

      claim = full.claim({
        canvas: element,
        tier,
        still: reducedMotion(forced),
        onLost: () => refuse(),
      });

      if (claim === null) {
        refuse();
      } else {
        syncSeen();
      }
    });

    return () => {
      unmounted = true;
      claim?.release();
      stopScreen();
      stopTab();
    };
  }, [canvas, forced, runtime, tier]);
};

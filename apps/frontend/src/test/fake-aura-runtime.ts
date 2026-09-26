import type { Tier } from "ranked";

import type { AuraRuntime } from "@/lib/aura-runtime";
import { type FullAuraPainter, openFullAuraRuntime } from "@/lib/full-aura-runtime";

// A painter the test reads: how often it drew, whether it was let go, and a way to lose its
// context as a driver would.
export type FakePainter = {
  canvas: HTMLCanvasElement;
  tier: Tier;
  draws: number;
  disposed: boolean;
  lose: () => void;
};

type FakeAuraRuntimeOptions = {
  // Whether the browser has WebGL2.
  webgl2?: boolean;
  // The screen's pixel density.
  pixelRatio?: number;
};

// A browser the test drives: every Ornament starts on screen in a shown tab, the full Aura's
// frames come when the test ticks them, and WebGL2 paints into fake painters.
export const fakeAuraRuntime = ({ webgl2 = true, pixelRatio = 1 }: FakeAuraRuntimeOptions = {}) => {
  const screens = new Map<Element, (onScreen: boolean) => void>();
  const tabs = new Set<(shown: boolean) => void>();
  const painters: FakePainter[] = [];
  let onFrame: ((time: number) => void) | null = null;
  let now = 0;

  const full = openFullAuraRuntime({
    open: (canvas, tier, onLost) => {
      if (!webgl2) {
        return null;
      }

      const painter: FakePainter = {
        canvas,
        tier,
        draws: 0,
        disposed: false,
        lose: () => onLost(),
      };

      painters.push(painter);

      const counting: FullAuraPainter = {
        draw: () => {
          painter.draws += 1;
        },
        dispose: () => {
          painter.disposed = true;
        },
      };

      return counting;
    },
    frames: (each) => {
      onFrame = each;

      return () => {
        onFrame = null;
      };
    },
    pixelRatio: () => pixelRatio,
  });

  const runtime: AuraRuntime = {
    watchScreen: (element, onChange) => {
      screens.set(element, onChange);
      onChange(true);

      return () => {
        screens.delete(element);
      };
    },
    watchTab: (onChange) => {
      tabs.add(onChange);
      onChange(true);

      return () => {
        tabs.delete(onChange);
      };
    },
    loadFullAura: () => Promise.resolve(full),
  };

  return {
    runtime,
    // The Ornaments and canvases watched, in the order they mounted.
    watched: () => [...screens.keys()],
    setOnScreen: (element: Element, onScreen: boolean) => screens.get(element)?.(onScreen),
    setTabShown: (shown: boolean) => {
      for (const report of tabs) {
        report(shown);
      }
    },
    watching: () => screens.size + tabs.size,
    painters,
    // Whether the shared frame loop runs.
    looping: () => onFrame !== null,
    // One frame of the shared loop, if it runs.
    tick: () => {
      now += 1 / 60;
      onFrame?.(now);
    },
  };
};

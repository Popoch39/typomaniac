import type { Tier } from "ranked";

// A full Aura asked for: its Tier, drawn on its canvas, as a single still image under reduced
// motion. `onLost` says the canvas can no longer draw it (its WebGL context lost): the light Aura
// takes its place.
export type FullAuraRequest = {
  canvas: HTMLCanvasElement;
  tier: Tier;
  still: boolean;
  onLost: () => void;
};

// A full Aura granted: drawn only while seen (on screen in a shown tab), until released.
export type FullAuraClaim = {
  see: (seen: boolean) => void;
  release: () => void;
};

// Grants a full Aura, or refuses it (null): without WebGL2, or while too many are shown.
export type FullAuraRuntime = {
  claim: (request: FullAuraRequest) => FullAuraClaim | null;
};

// Refuses every full Aura: the light one is drawn instead.
export const refusingFullAuraRuntime: FullAuraRuntime = { claim: () => null };

// What the Aura needs from the browser to move only when it is seen: whether an Ornament is on
// screen, and whether the tab is shown. Each watch reports as soon as it knows, then at each
// change, until it is stopped. And the full Aura's runtime, loaded the first time one is asked
// for. The browser in the app, a fake in the tests.
export type AuraRuntime = {
  watchScreen: (element: Element, onChange: (onScreen: boolean) => void) => () => void;
  watchTab: (onChange: (shown: boolean) => void) => () => void;
  loadFullAura: () => Promise<FullAuraRuntime>;
};

// Always on screen, the tab always shown: what moves keeps moving, as before the Aura paused.
// Never a full Aura.
export const steadyAuraRuntime: AuraRuntime = {
  loadFullAura: () => Promise.resolve(refusingFullAuraRuntime),
  watchScreen: (_element, onChange) => {
    onChange(true);

    return () => {};
  },
  watchTab: (onChange) => {
    onChange(true);

    return () => {};
  },
};

// How far beyond the viewport an Ornament starts moving, so it already shines as it scrolls in.
const SCREEN_MARGIN = "64px";

// What the runtime reads of an IntersectionObserver, so tests can hand it one that reports.
type ScreenEntry = { target: Element; isIntersecting: boolean };

type ScreenObserver = {
  observe: (element: Element) => void;
  unobserve: (element: Element) => void;
};

type OpenScreenObserver = (report: (entries: readonly ScreenEntry[]) => void) => ScreenObserver;

const openIntersectionObserver: OpenScreenObserver = (report) =>
  new IntersectionObserver(report, { rootMargin: SCREEN_MARGIN });

const tabShown = () => document.visibilityState !== "hidden";

// The WebGL code, out of the first chunk: fetched the first time a full Aura is asked for. A
// failed fetch refuses every full Aura rather than breaking the page.
const importBrowserFullAura = () =>
  import("@/lib/browser-full-aura").then(
    (module) => module.browserFullAuraRuntime(),
    () => refusingFullAuraRuntime,
  );

// The browser's own. One observer and one tab listener for every Ornament, however many a list
// shows: the observer opened at the first watch, the listener there while anything watches. The
// full Aura's runtime, loaded once.
export const browserAuraRuntime = (
  openObserver: OpenScreenObserver = openIntersectionObserver,
): AuraRuntime => {
  const listeners = new Map<Element, (onScreen: boolean) => void>();
  const tabListeners = new Set<(shown: boolean) => void>();
  let observer: ScreenObserver | null = null;
  let fullAura: Promise<FullAuraRuntime> | null = null;

  const reportTab = () => {
    for (const onChange of tabListeners) {
      onChange(tabShown());
    }
  };

  const observe = () => {
    observer ??= openObserver((entries) => {
      for (const entry of entries) {
        listeners.get(entry.target)?.(entry.isIntersecting);
      }
    });

    return observer;
  };

  return {
    loadFullAura: () => {
      fullAura ??= importBrowserFullAura();

      return fullAura;
    },
    watchScreen: (element, onChange) => {
      listeners.set(element, onChange);
      observe().observe(element);

      return () => {
        listeners.delete(element);
        observer?.unobserve(element);
      };
    },
    watchTab: (onChange) => {
      if (tabListeners.size === 0) {
        document.addEventListener("visibilitychange", reportTab);
      }

      tabListeners.add(onChange);
      onChange(tabShown());

      return () => {
        tabListeners.delete(onChange);

        if (tabListeners.size === 0) {
          document.removeEventListener("visibilitychange", reportTab);
        }
      };
    },
  };
};

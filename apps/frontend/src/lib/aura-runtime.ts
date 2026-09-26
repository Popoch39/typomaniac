// What the Aura needs from the browser to move only when it is seen: whether an Ornament is on
// screen, and whether the tab is shown. Each watch reports as soon as it knows, then at each
// change, until it is stopped. The browser in the app, a fake in the tests.
export type AuraRuntime = {
  watchScreen: (element: Element, onChange: (onScreen: boolean) => void) => () => void;
  watchTab: (onChange: (shown: boolean) => void) => () => void;
};

// Always on screen, the tab always shown: what moves keeps moving, as before the Aura paused.
export const steadyAuraRuntime: AuraRuntime = {
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

// The browser's own. One observer for every Ornament, however many a list shows, opened at the
// first watch.
export const browserAuraRuntime = (
  openObserver: OpenScreenObserver = openIntersectionObserver,
): AuraRuntime => {
  const listeners = new Map<Element, (onScreen: boolean) => void>();
  let observer: ScreenObserver | null = null;

  const observe = () => {
    observer ??= openObserver((entries) => {
      for (const entry of entries) {
        listeners.get(entry.target)?.(entry.isIntersecting);
      }
    });

    return observer;
  };

  return {
    watchScreen: (element, onChange) => {
      listeners.set(element, onChange);
      observe().observe(element);

      return () => {
        listeners.delete(element);
        observer?.unobserve(element);
      };
    },
    watchTab: (onChange) => {
      const report = () => onChange(document.visibilityState !== "hidden");

      report();
      document.addEventListener("visibilitychange", report);

      return () => document.removeEventListener("visibilitychange", report);
    },
  };
};

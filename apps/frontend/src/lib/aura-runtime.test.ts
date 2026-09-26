import { afterEach, describe, expect, test, vi } from "vitest";

import { browserAuraRuntime } from "@/lib/aura-runtime";

type Report = (entries: readonly { target: Element; isIntersecting: boolean }[]) => void;

// An observer the test drives: it reports what the test says, and remembers what it watches.
const fakeObserver = () => {
  const watched = new Set<Element>();
  const reports: Report[] = [];
  let opened = 0;

  return {
    open: (report: Report) => {
      opened += 1;
      reports.push(report);

      return {
        observe: (element: Element) => watched.add(element),
        unobserve: (element: Element) => watched.delete(element),
      };
    },
    report: (target: Element, isIntersecting: boolean) => {
      for (const report of reports) {
        report([{ target, isIntersecting }]);
      }
    },
    watched,
    opened: () => opened,
  };
};

const hideTab = (hidden: boolean) => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue(hidden ? "hidden" : "visible");
  document.dispatchEvent(new Event("visibilitychange"));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("browserAuraRuntime", () => {
  test("tells each Ornament when it comes on screen and leaves it", () => {
    const observer = fakeObserver();
    const runtime = browserAuraRuntime(observer.open);
    const first = document.createElement("span");
    const second = document.createElement("span");
    const seen: [string, boolean][] = [];

    runtime.watchScreen(first, (onScreen) => seen.push(["first", onScreen]));
    runtime.watchScreen(second, (onScreen) => seen.push(["second", onScreen]));
    observer.report(first, true);
    observer.report(second, false);
    observer.report(first, false);

    expect(seen).toEqual([
      ["first", true],
      ["second", false],
      ["first", false],
    ]);
  });

  test("watches every Ornament with a single observer", () => {
    const observer = fakeObserver();
    const runtime = browserAuraRuntime(observer.open);

    runtime.watchScreen(document.createElement("span"), () => {});
    runtime.watchScreen(document.createElement("span"), () => {});

    expect(observer.opened()).toBe(1);
    expect(observer.watched.size).toBe(2);
  });

  test("forgets an Ornament once stopped", () => {
    const observer = fakeObserver();
    const runtime = browserAuraRuntime(observer.open);
    const element = document.createElement("span");
    const seen: boolean[] = [];

    const stop = runtime.watchScreen(element, (onScreen) => seen.push(onScreen));

    stop();
    observer.report(element, true);

    expect(observer.watched.size).toBe(0);
    expect(seen).toEqual([]);
  });

  test("tells whether the tab is shown, now and at each change, until stopped", () => {
    const runtime = browserAuraRuntime(fakeObserver().open);
    const seen: boolean[] = [];

    const stop = runtime.watchTab((shown) => seen.push(shown));

    hideTab(true);
    hideTab(false);
    stop();
    hideTab(true);

    expect(seen).toEqual([true, false, true]);
  });

  test("listens to the tab once for every Ornament, and no more once none watches", () => {
    const runtime = browserAuraRuntime(fakeObserver().open);
    const listen = vi.spyOn(document, "addEventListener");
    const unlisten = vi.spyOn(document, "removeEventListener");
    const seen: [string, boolean][] = [];

    const stopFirst = runtime.watchTab((shown) => seen.push(["first", shown]));
    const stopSecond = runtime.watchTab((shown) => seen.push(["second", shown]));

    hideTab(true);
    stopFirst();
    stopSecond();

    expect(listen).toHaveBeenCalledTimes(1);
    expect(unlisten).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([
      ["first", true],
      ["second", true],
      ["first", false],
      ["second", false],
    ]);
  });
});

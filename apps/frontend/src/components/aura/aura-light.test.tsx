import { render } from "@testing-library/react";
import { gsap } from "gsap";
import type { ReactNode } from "react";
import type { Tier } from "ranked";
import { afterEach, describe, expect, test, vi } from "vitest";

import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import { TierBlason } from "@/components/tier/tier-blason";
import { TierSprite } from "@/components/tier/tier-sprite";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import type { AuraRuntime } from "@/lib/aura-runtime";

const SHINING: readonly Tier[] = ["or", "platine", "diamant", "maniac"];

const DULL: readonly Tier[] = ["fer", "bronze", "argent"];

// What a tween may change: transforms and opacity; the rest only says how.
const TIMING = new Set(["duration", "ease", "repeat", "repeatDelay", "yoyo", "svgOrigin"]);

// GSAP adds its own `overwrite` and `delay`.
const HOW = new Set([...TIMING, "overwrite", "delay"]);

// A browser the test drives: every Ornament starts on screen in a shown tab.
const fakeRuntime = () => {
  const screens = new Map<Element, (onScreen: boolean) => void>();
  const tabs = new Set<(shown: boolean) => void>();

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
  };

  return {
    runtime,
    // The Ornaments watched, in the order they mounted.
    watched: () => [...screens.keys()],
    setOnScreen: (element: Element, onScreen: boolean) => screens.get(element)?.(onScreen),
    setTabShown: (shown: boolean) => {
      for (const report of tabs) {
        report(shown);
      }
    },
    watching: () => screens.size + tabs.size,
  };
};

const renderAura = (children: ReactNode, runtime: AuraRuntime = fakeRuntime().runtime) =>
  render(
    <>
      <TierSprite />
      <AuraRuntimeContext value={runtime}>{children}</AuraRuntimeContext>
    </>,
  );

const avatar = (ornament: Tier | null) => (
  <UserAvatar handle="ada" image={null} ornament={ornament} />
);

const sheens = (root: HTMLElement) => [...root.querySelectorAll("[data-aura-sheen]")];

const sparks = (root: HTMLElement) => [...root.querySelectorAll("[data-aura-spark]")];

const tweensOf = (target: Element) => gsap.getTweensOf(target);

const changed = (target: Element) =>
  tweensOf(target).flatMap((tween) => Object.keys(tween.vars).filter((key) => !HOW.has(key)));

// Every tween of one Ornament: its glow, its rays, its sheen and its sparks.
const tweensIn = (root: Element) =>
  [
    ...root.querySelectorAll(
      "[data-ornament-glow], [data-ornament-rays], [data-aura-sheen], [data-aura-spark]",
    ),
  ].flatMap(tweensOf);

const liveTweens = () => gsap.globalTimeline.getChildren(true, true, false);

const reduceMotion = () =>
  vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
    matches: media === "(prefers-reduced-motion: reduce)",
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the light Aura", () => {
  test.each(SHINING)("a sheen sweeps the Ornament of %s now and then", (tier) => {
    const { container } = renderAura(avatar(tier));
    const [sheen] = sheens(container);

    expect(sheen).toBeDefined();
    expect(tweensOf(sheen ?? container)).toHaveLength(1);
  });

  test.each(DULL)("%s has no sheen", (tier) => {
    const { container } = renderAura(avatar(tier));

    expect(sheens(container)).toEqual([]);
  });

  test("no Ornament, or a User in Placement, has no Aura", () => {
    const { container } = renderAura(avatar(null));

    expect(sheens(container)).toEqual([]);
    expect(sparks(container)).toEqual([]);
  });

  test("a User who froze the Or Ornament wears the Aura of Or, whatever their Tier", () => {
    // The API resolves the worn Ornament: a Maniac who froze Or is handed `or`.
    const { container } = renderAura(avatar("or"));

    expect(sheens(container)).toHaveLength(1);
    expect(sparks(container)).toEqual([]);
    expect(container.querySelector("[data-ornament-rays]")).toBeNull();
  });

  test.each(["diamant", "maniac"] as const)("%s twinkles with sparks", (tier) => {
    const { container } = renderAura(avatar(tier));

    expect(sparks(container).length).toBeGreaterThan(0);

    for (const spark of sparks(container)) {
      expect(changed(spark).toSorted()).toEqual(["opacity", "scale"]);
    }
  });

  test.each(["or", "platine"] as const)("%s has no sparks", (tier) => {
    const { container } = renderAura(avatar(tier));

    expect(sparks(container)).toEqual([]);
  });

  test("the sheen moves by a transform only, inside the Ornament's own shape", () => {
    const { container } = renderAura(<TierBlason tier="diamant" />);
    const [sheen] = sheens(container);
    const cut = sheen?.closest("[mask]");

    expect(changed(sheen ?? container)).toEqual(["x"]);
    expect(cut?.getAttribute("mask")).toBe("url(#tier-sheen-mask-diamant)");
    expect(container.querySelector("mask#tier-sheen-mask-diamant use")?.getAttribute("href")).toBe(
      "#tier-ornament-diamant",
    );
  });

  test("the glow and the Maniac's rays stay as they were", () => {
    const { container } = renderAura(avatar("maniac"));

    expect(changed(container.querySelector("[data-ornament-glow]") ?? container)).toEqual([
      "opacity",
    ]);
    expect(changed(container.querySelector("[data-ornament-rays]") ?? container)).toEqual([
      "rotation",
    ]);
  });

  test("off screen nothing moves; back on screen, the same tweens go on", () => {
    const browser = fakeRuntime();

    const { container } = renderAura(
      <>
        {avatar("maniac")}
        {avatar("diamant")}
      </>,
      browser.runtime,
    );

    const [first, second] = browser.watched();
    const tweens = tweensIn(first ?? container);

    browser.setOnScreen(first ?? container, false);

    expect(tweens.length).toBeGreaterThan(0);
    expect(tweens.every((tween) => tween.paused())).toBe(true);
    expect(tweensIn(second ?? container).some((tween) => tween.paused())).toBe(false);

    browser.setOnScreen(first ?? container, true);

    expect(tweensIn(first ?? container)).toEqual(tweens);
    expect(tweens.some((tween) => tween.paused())).toBe(false);
  });

  test("a hidden tab stops every Aura, and starts them again once shown", () => {
    const browser = fakeRuntime();

    const { container } = renderAura(
      <>
        {avatar("or")}
        <TierBlason tier="maniac" />
      </>,
      browser.runtime,
    );

    const tweens = tweensIn(container);

    browser.setTabShown(false);

    expect(tweens.every((tween) => tween.paused())).toBe(true);

    browser.setTabShown(true);

    expect(tweens.some((tween) => tween.paused())).toBe(false);
  });

  test("an Ornament that is on screen but in a hidden tab stays still", () => {
    const browser = fakeRuntime();
    const { container } = renderAura(avatar("or"), browser.runtime);
    const [ornament] = browser.watched();

    browser.setTabShown(false);
    browser.setOnScreen(ornament ?? container, true);

    expect(tweensIn(container).every((tween) => tween.paused())).toBe(true);
  });

  test("two neighbours never start their sheen together", () => {
    const { container } = renderAura(
      <>
        {avatar("or")}
        {avatar("or")}
      </>,
    );

    const delays = sheens(container).map((sheen) => tweensOf(sheen)[0]?.delay());

    expect(delays).toHaveLength(2);
    expect(delays[0]).not.toBe(delays[1]);
  });

  test("under reduced motion, neither sheen nor spark moves", () => {
    reduceMotion();
    const { container } = renderAura(<TierBlason tier="maniac" />);

    expect([...sheens(container), ...sparks(container)].flatMap(tweensOf)).toEqual([]);
    expect(liveTweens()).toEqual([]);
  });

  test("once unmounted, no tween is left alive and nothing is watched", () => {
    const browser = fakeRuntime();

    const { unmount } = renderAura(
      <>
        {avatar("maniac")}
        <TierBlason tier="diamant" />
      </>,
      browser.runtime,
    );

    expect(liveTweens().length).toBeGreaterThan(0);
    expect(browser.watching()).toBeGreaterThan(0);

    unmount();

    expect(liveTweens()).toEqual([]);
    expect(browser.watching()).toBe(0);
  });
});

import { render } from "@testing-library/react";
import { gsap } from "gsap";
import { type Tier, TIERS } from "ranked";
import { afterEach, describe, expect, test, vi } from "vitest";

import { TierBlason } from "@/components/tier/tier-blason";
import { TierOrnament } from "@/components/tier/tier-ornament";
import { TierSprite } from "@/components/tier/tier-sprite";

const GLOWING: readonly Tier[] = ["or", "platine", "diamant", "maniac"];

const STILL: readonly Tier[] = ["fer", "bronze", "argent"];

// What a tween may change: opacity and transforms, the rest only says how (GSAP adds its own
// `overwrite` and `delay`).
const TIMING = new Set(["duration", "ease", "repeat", "yoyo", "svgOrigin", "overwrite", "delay"]);

const animated = (target: Element | null) =>
  target === null ? [] : gsap.getTweensOf(target).flatMap((tween) => Object.keys(tween.vars));

const changed = (target: Element | null) => animated(target).filter((key) => !TIMING.has(key));

const glow = (root: HTMLElement) => root.querySelector("[data-ornament-glow]");

const rays = (root: HTMLElement) => root.querySelector("[data-ornament-rays]");

// Every tween still alive, anywhere.
const liveTweens = () => gsap.globalTimeline.getChildren(true, true, false);

// The User prefers reduced motion: the Ornament reads it when it mounts.
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

describe("the Ornament's motion", () => {
  test.each(GLOWING)("the glow of %s pulses, in opacity only", (tier) => {
    const { container } = render(<TierOrnament tier={tier} />);

    expect(changed(glow(container))).toEqual(["opacity"]);
  });

  test("the Maniac's rays turn, by a transform only", () => {
    const { container } = render(<TierOrnament tier="maniac" />);

    expect(changed(rays(container))).toEqual(["rotation"]);
  });

  test.each(TIERS.filter((tier) => tier !== "maniac"))("%s has no rays", (tier) => {
    const { container } = render(<TierOrnament tier={tier} />);

    expect(rays(container)).toBeNull();
  });

  test.each(STILL)("%s neither glows nor moves", (tier) => {
    const { container } = render(<TierOrnament tier={tier} />);

    expect(glow(container)).toBeNull();
    expect(liveTweens()).toEqual([]);
  });

  test("the Blason's Ornament moves as well", () => {
    const { container } = render(<TierBlason tier="maniac" />);

    expect(changed(glow(container))).toEqual(["opacity"]);
    expect(changed(rays(container))).toEqual(["rotation"]);
  });

  test("each instance moves on its own", () => {
    const { container } = render(
      <>
        <TierOrnament tier="or" />
        <TierOrnament tier="or" />
      </>,
    );

    const glows = [...container.querySelectorAll("[data-ornament-glow]")];

    expect(glows).toHaveLength(2);
    expect(glows.map((each) => gsap.getTweensOf(each).length)).toEqual([1, 1]);
  });

  test("under reduced motion, nothing is created: the glow stays lit, the rays still", () => {
    reduceMotion();
    const { container } = render(<TierBlason tier="maniac" />);

    expect(glow(container)).not.toBeNull();
    expect(rays(container)).not.toBeNull();
    expect(liveTweens()).toEqual([]);
  });

  test("once unmounted, no tween is left alive", () => {
    const { container, unmount } = render(
      <>
        <TierOrnament tier="maniac" />
        <TierBlason tier="diamant" />
      </>,
    );

    const moving = [...container.querySelectorAll("[data-ornament-glow], [data-ornament-rays]")];

    expect(liveTweens().length).toBeGreaterThan(0);

    unmount();

    expect(moving.flatMap((each) => gsap.getTweensOf(each))).toEqual([]);
    expect(liveTweens()).toEqual([]);
  });

  test("the sprite's shared Ornaments carry neither glow nor rays: each instance draws its own", () => {
    const { container } = render(<TierSprite />);

    for (const tier of TIERS) {
      const symbol = container.querySelector(`symbol#tier-ornament-${tier}`);

      expect(symbol?.querySelector(`[fill="url(#tier-glow-${tier})"]`)).toBeNull();
      // The rays: one wide dashed stroke.
      expect(symbol?.querySelector('[stroke-width="36"]')).toBeNull();
    }
  });
});

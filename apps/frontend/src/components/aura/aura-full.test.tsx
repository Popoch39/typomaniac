import { act, render } from "@testing-library/react";
import { gsap } from "gsap";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import { TierBlason } from "@/components/tier/tier-blason";
import { TierSprite } from "@/components/tier/tier-sprite";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import type { AuraRuntime } from "@/lib/aura-runtime";
import { fakeAuraRuntime } from "@/test/fake-aura-runtime";

const renderAura = (children: ReactNode, runtime: AuraRuntime = fakeAuraRuntime().runtime) =>
  render(
    <>
      <TierSprite />
      <AuraRuntimeContext value={runtime}>{children}</AuraRuntimeContext>
    </>,
  );

const fullOr = <UserAvatar handle="ada" image={null} ornament="or" aura="full" />;

// Once the full Aura's runtime has loaded and answered.
const settle = () => act(async () => {});

const canvases = (root: HTMLElement) => root.querySelectorAll("[data-aura-canvas]");

const glows = (root: HTMLElement) => root.querySelectorAll("[data-ornament-glow]");

const sheens = (root: HTMLElement) => root.querySelectorAll("[data-aura-sheen]");

// The initials of the avatars whose Aura is light.
const light = (root: HTMLElement) =>
  [...root.querySelectorAll("[data-slot=avatar]")].flatMap((avatar) =>
    avatar.querySelector("[data-ornament-glow]") === null ? [] : [avatar.textContent],
  );

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

describe("the full Aura of Or", () => {
  test("is drawn on a canvas behind the Ornament, in place of its glow, under its sheen", async () => {
    const browser = fakeAuraRuntime();
    const { container } = renderAura(fullOr, browser.runtime);

    await settle();
    browser.tick();

    expect(canvases(container)).toHaveLength(1);
    expect(browser.painters[0]?.canvas.closest("[data-ornament]")).not.toBeNull();
    expect(browser.painters.map((painter) => [painter.tier, painter.draws])).toEqual([["or", 1]]);
    expect(glows(container)).toHaveLength(0);
    expect(sheens(container)).toHaveLength(1);
  });

  test("is drawn behind a Blason asked for it too", async () => {
    const browser = fakeAuraRuntime();
    const { container } = renderAura(<TierBlason tier="or" aura="full" />, browser.runtime);

    await settle();
    browser.tick();

    expect(browser.painters.map((painter) => painter.draws)).toEqual([1]);
    expect(glows(container)).toHaveLength(0);
    expect(container.querySelector("[data-tier-blason]")).not.toBeNull();
  });

  test("is never drawn unless asked for: the Aura is light", async () => {
    const browser = fakeAuraRuntime();

    const { container } = renderAura(
      <>
        <UserAvatar handle="ada" image={null} ornament="or" />
        <TierBlason tier="or" />
      </>,
      browser.runtime,
    );

    await settle();

    expect(canvases(container)).toHaveLength(0);
    expect(browser.painters).toEqual([]);
    expect(glows(container)).toHaveLength(2);
  });

  test("stays light for a Tier without one yet", async () => {
    const browser = fakeAuraRuntime();

    const { container } = renderAura(
      <UserAvatar handle="ada" image={null} ornament="platine" aura="full" />,
      browser.runtime,
    );

    await settle();

    expect(browser.painters).toEqual([]);
    expect(glows(container)).toHaveLength(1);
  });

  test("without WebGL2, the light Aura is drawn instead, without an error", async () => {
    const error = vi.spyOn(console, "error");
    const { container } = renderAura(fullOr, fakeAuraRuntime({ webgl2: false }).runtime);

    await settle();

    expect(canvases(container)).toHaveLength(0);
    expect(glows(container)).toHaveLength(1);
    expect(sheens(container)).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();
  });

  test("the ninth is light; unmounting a full one frees its place for the next", async () => {
    const browser = fakeAuraRuntime();

    const handles = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

    // Each avatar named after its Handle, so the test can tell which is light.
    const avatars = (shown: readonly string[]) => (
      <>
        <TierSprite />
        <AuraRuntimeContext value={browser.runtime}>
          {shown.map((handle) => (
            <UserAvatar key={handle} handle={handle} image={null} ornament="or" aura="full" />
          ))}
        </AuraRuntimeContext>
      </>
    );

    const { container, rerender } = render(avatars(handles));

    await settle();

    expect(canvases(container)).toHaveLength(8);
    expect(light(container)).toEqual(["I"]);

    // The first leaves: the ninth stays light, a newcomer takes the place.
    rerender(avatars([...handles.slice(1), "j"]));
    await settle();

    expect(canvases(container)).toHaveLength(8);
    expect(light(container)).toEqual(["I"]);
    expect(browser.painters.filter((painter) => !painter.disposed)).toHaveLength(8);
  });

  test("once its context is lost, the light Aura takes its place", async () => {
    const browser = fakeAuraRuntime();
    const { container } = renderAura(fullOr, browser.runtime);

    await settle();
    act(() => browser.painters[0]?.lose());

    expect(canvases(container)).toHaveLength(0);
    expect(glows(container)).toHaveLength(1);
    expect(browser.looping()).toBe(false);
  });

  test("off screen, or in a hidden tab, the loop does not draw it", async () => {
    const browser = fakeAuraRuntime();

    renderAura(
      <>
        {fullOr}
        {fullOr}
      </>,
      browser.runtime,
    );

    await settle();

    const [first, second] = browser.painters;

    browser.setOnScreen(first?.canvas ?? document.body, false);
    browser.tick();

    expect([first?.draws, second?.draws]).toEqual([0, 1]);

    browser.setTabShown(false);
    browser.tick();

    expect([first?.draws, second?.draws]).toEqual([0, 1]);
    expect(browser.looping()).toBe(false);

    browser.setTabShown(true);
    browser.setOnScreen(first?.canvas ?? document.body, true);
    browser.tick();

    expect([first?.draws, second?.draws]).toEqual([1, 2]);
  });

  test("under reduced motion, exactly one image is drawn", async () => {
    reduceMotion();
    const browser = fakeAuraRuntime();

    renderAura(fullOr, browser.runtime);
    await settle();
    browser.tick();
    browser.tick();
    browser.tick();

    expect(browser.painters.map((painter) => painter.draws)).toEqual([1]);
    expect(browser.looping()).toBe(false);
  });

  test("is drawn at 1.5 pixels per CSS pixel at most", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
    const browser = fakeAuraRuntime({ pixelRatio: 3 });

    renderAura(fullOr, browser.runtime);
    await settle();
    browser.tick();

    expect([browser.painters[0]?.canvas.width, browser.painters[0]?.canvas.height]).toEqual([
      150, 150,
    ]);
  });

  test("once unmounted, no frame loop, context, tween nor watch is left", async () => {
    const browser = fakeAuraRuntime();

    const { unmount } = renderAura(
      <>
        {fullOr}
        <TierBlason tier="or" aura="full" />
      </>,
      browser.runtime,
    );

    await settle();

    expect(browser.looping()).toBe(true);

    unmount();

    expect(browser.looping()).toBe(false);
    expect(browser.painters.map((painter) => painter.disposed)).toEqual([true, true]);
    expect(gsap.globalTimeline.getChildren(true, true, false)).toEqual([]);
    expect(browser.watching()).toBe(0);
  });

  test("unmounted before its runtime loads, it never claims a place", async () => {
    const browser = fakeAuraRuntime();
    const { unmount } = renderAura(fullOr, browser.runtime);

    unmount();
    await settle();

    expect(browser.painters).toEqual([]);
  });
});

/**
 * happy-dom runs no script by default; these tests run the one of index.html, as the browser does.
 * @vitest-environment-options { "settings": { "enableJavaScriptEvaluation": true } }
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import page from "@/../index.html?raw";
import { THEMES } from "@/components/theme/themes";
import stylesheet from "@/index.css?raw";
import { useThemeStore } from "@/stores/theme-store";

// index.html sets the stored Theme before the app and its CSS load, reading the theme store's
// entry by itself: these tests keep the two, and the stylesheet, in step.
const parsed = new DOMParser().parseFromString(page, "text/html");

const bootScript = parsed.querySelector("script:not([src])")?.textContent ?? "";

const bootStyle = parsed.querySelector("style")?.textContent ?? "";

// Loads the page again: runs the inline script, as the browser does before anything else.
const boot = () => {
  const script = document.createElement("script");

  script.textContent = bootScript;
  document.head.append(script);
  script.remove();
};

const pageTheme = () => document.documentElement.dataset.theme;

// The Theme's ink in the stylesheet, and the one index.html paints first (Corail's on :root).
const inkIn = (css: string, rule: RegExp) => css.match(rule)?.[1];

const cssInk = (id: string) =>
  id === "corail"
    ? inkIn(stylesheet, /:root,\s*\[data-theme\]\s*\{[^}]*--ink:\s*(#[0-9a-f]{6})/)
    : inkIn(stylesheet, new RegExp(`\\[data-theme="${id}"\\]\\s*\\{[^}]*--ink:\\s*(#[0-9a-f]{6})`));

const paintedInk = (id: string) =>
  id === "corail"
    ? inkIn(bootStyle, /html\s*\{\s*background:\s*(#[0-9a-f]{6})/)
    : inkIn(
        bootStyle,
        new RegExp(`html\\[data-theme="${id}"\\]\\s*\\{\\s*background:\\s*(#[0-9a-f]{6})`),
      );

// Whether the browser's native controls are dark or light: the meta, then the stylesheet.
const pageScheme = () =>
  document.querySelector('meta[name="color-scheme"]')?.getAttribute("content");

// A Theme without a scheme of its own keeps the base's, Corail's on :root.
const baseScheme = inkIn(stylesheet, /:root,\s*\[data-theme\]\s*\{[^}]*color-scheme:\s*(\w+)/);

const cssScheme = (id: string) =>
  inkIn(stylesheet, new RegExp(`\\[data-theme="${id}"\\]\\s*\\{[^}]*color-scheme:\\s*(\\w+)`)) ??
  baseScheme;

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = '<meta name="color-scheme" content="dark" />';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the Theme set before the first paint", () => {
  test.each(THEMES.map((theme) => theme.id))("%s, stored by the theme store, is set", (id) => {
    useThemeStore.getState().setTheme(id);
    boot();

    expect(pageTheme()).toBe(id);
  });

  test.each([
    ["nothing stored", null],
    ["unreadable JSON", "{not json"],
    ["another version", JSON.stringify({ state: { theme: "lagon" }, version: 2 })],
    ["no Theme", JSON.stringify({ state: {}, version: 1 })],
  ])("%s sets none: Corail", (_, value) => {
    if (value !== null) {
      localStorage.setItem("typomaniac-theme", value);
    }

    boot();

    expect(pageTheme()).toBeUndefined();
  });

  test("a storage that throws sets none, without breaking the page", () => {
    // Once, the boot's one read: restoring the spy leaves happy-dom's storage throwing.
    vi.spyOn(localStorage, "getItem").mockImplementationOnce(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(boot).not.toThrow();
    expect(pageTheme()).toBeUndefined();
  });

  test.each(THEMES.map((theme) => theme.id))("%s is painted in its own ink", (id) => {
    expect(cssInk(id)).toMatch(/^#/);
    expect(paintedInk(id)).toBe(cssInk(id));
  });

  test.each(THEMES.map((theme) => [theme.id, theme.scheme]))(
    "%s turns the native controls %s, before the CSS and in it",
    (id, scheme) => {
      useThemeStore.getState().setTheme(id);
      boot();

      expect(pageScheme()).toBe(scheme);
      expect(cssScheme(id)).toBe(scheme);
    },
  );

  test("Papier is the only light one", () => {
    expect(THEMES.flatMap((theme) => (theme.scheme === "light" ? [theme.id] : []))).toEqual([
      "papier",
    ]);
  });
});

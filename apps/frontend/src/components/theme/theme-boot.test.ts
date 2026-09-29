/**
 * happy-dom runs no script by default; these tests run the one of index.html, as the browser does.
 * @vitest-environment-options { "settings": { "enableJavaScriptEvaluation": true } }
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import page from "@/../index.html?raw";
import { LOGO_DRAWINGS } from "@/components/brand/logo-drawings";
import { themeFavicon } from "@/components/theme/theme-favicon";
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

// The body of a Theme's rule in the stylesheet: Corail's is the base, on :root.
const cssRule = (id: string) =>
  stylesheet.match(
    id === "corail"
      ? /:root,\s*\[data-theme\]\s*\{([^}]*)\}/
      : new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([^}]*)\\}`),
  )?.[1] ?? "";

const declared = (rule: string, property: string) =>
  rule.match(new RegExp(`\\s${property}:\\s*([^;]+);`))?.[1];

// What the stylesheet gives a Theme (`--ink`, `--text`, `--brand`, `color-scheme`): its own rule's,
// else the base's.
const cssToken = (id: string, property: string) =>
  declared(cssRule(id), property) ?? declared(cssRule("corail"), property);

// The ink index.html paints first.
const paintedInk = (id: string) =>
  bootStyle.match(
    id === "corail"
      ? /html\s*\{[^}]*\sbackground:\s*(#[0-9a-f]{6})/
      : new RegExp(`html\\[data-theme="${id}"\\]\\s*\\{[^}]*\\sbackground:\\s*(#[0-9a-f]{6})`),
  )?.[1];

// Whether the browser's native controls are dark or light: the meta, then the stylesheet.
const pageScheme = () =>
  document.querySelector('meta[name="color-scheme"]')?.getAttribute("content");

// The tab's icon: index.html's own link, Corail's until the script says otherwise.
const iconLink = parsed.querySelector('link[rel="icon"]')?.outerHTML ?? "";

const pageIcon = () => document.querySelector('link[rel="icon"]')?.getAttribute("href");

// The icons themselves, public/favicons/, each by the URL the tab loads it from.
const favicons = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("/public/favicons/*.svg", {
      query: "?raw",
      import: "default",
      eager: true,
    }),
  ).map(([file, svg]) => [file.replace(/^\/public/, ""), svg]),
);

// The Logo shown in #root until React's first render replaces it.
const bootRoot = parsed.querySelector("#root")?.outerHTML ?? "";

const bootLogo = parsed.querySelector("#root svg");

// The page as the browser paints it before the app's CSS: the boot's style, then #root.
const showBootPage = () => {
  const style = document.createElement("style");

  style.textContent = bootStyle;
  document.head.append(style);
  document.body.innerHTML = bootRoot;
};

// The strokes a drawing of the Logo traces, as LOGO_DRAWINGS writes them: the t's stem, its bar,
// the wave.
const drawnStrokes = (drawing: ParentNode | null) =>
  Array.from(drawing?.querySelectorAll("path") ?? [], (path) => ({
    d: path.getAttribute("d"),
    width: Number(path.getAttribute("stroke-width")),
  }));

// The colour each stroke of the waiting Logo is painted in.
const logoStrokeColours = () =>
  Array.from(document.querySelectorAll("#root path"), (path) => getComputedStyle(path).stroke);

// The colours the stylesheet gives those strokes, for a Theme: its text, its text, its accent.
const cssLogoStrokeColours = (id: string) => [
  cssToken(id, "--text"),
  cssToken(id, "--text"),
  cssToken(id, "--brand"),
];

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.innerHTML = `${iconLink}<meta name="color-scheme" content="dark" />`;
  document.body.innerHTML = "";
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
    expect(cssToken(id, "--ink")).toMatch(/^#[0-9a-f]{6}$/);
    expect(paintedInk(id)).toBe(cssToken(id, "--ink"));
  });

  test.each(THEMES.map((theme) => [theme.id, theme.scheme]))(
    "%s turns the native controls %s, before the CSS and in it",
    (id, scheme) => {
      useThemeStore.getState().setTheme(id);
      boot();

      expect(pageScheme()).toBe(scheme);
      expect(cssToken(id, "color-scheme")).toBe(scheme);
    },
  );

  test("the tab's icon is Corail's until a Theme is stored", () => {
    expect(pageIcon()).toBe("/favicons/corail.svg");
  });

  test.each(THEMES.map((theme) => theme.id))("%s, stored, puts its own icon in the tab", (id) => {
    useThemeStore.getState().setTheme(id);
    boot();

    expect(pageIcon()).toBe(themeFavicon(id));
  });

  test.each([
    ["nothing stored", null],
    ["unreadable JSON", "{not json"],
    ["another version", JSON.stringify({ state: { theme: "lagon" }, version: 2 })],
    ["no Theme", JSON.stringify({ state: {}, version: 1 })],
    ["an unknown Theme", JSON.stringify({ state: { theme: "neon" }, version: 1 })],
  ])("%s keeps Corail's icon", (_, value) => {
    if (value !== null) {
      localStorage.setItem("typomaniac-theme", value);
    }

    boot();

    expect(pageIcon()).toBe(themeFavicon("corail"));
  });

  test("a storage that throws keeps Corail's icon", () => {
    vi.spyOn(localStorage, "getItem").mockImplementationOnce(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    boot();

    expect(pageIcon()).toBe(themeFavicon("corail"));
  });

  test("there is one icon per Theme, and no other", () => {
    expect(Object.keys(favicons).toSorted()).toEqual(
      THEMES.map((theme) => themeFavicon(theme.id)).toSorted(),
    );
  });

  test.each(THEMES.map((theme) => theme.id))(
    "%s's icon is the simplified Logo on a tile of its ink, in its text and accent",
    (id) => {
      const icon = new DOMParser().parseFromString(
        favicons[themeFavicon(id)] ?? "",
        "image/svg+xml",
      );

      const { stem, bar, wave } = LOGO_DRAWINGS.simplified;

      expect(icon.querySelector("rect")?.getAttribute("fill")).toBe(cssToken(id, "--ink"));
      expect(drawnStrokes(icon)).toEqual([stem, bar, wave]);
      expect(
        Array.from(icon.querySelectorAll("path"), (path) => path.getAttribute("stroke")),
      ).toEqual(cssLogoStrokeColours(id));
    },
  );

  test("the Logo waits in #root, the full drawing, named typomaniac", () => {
    const { stem, bar, wave } = LOGO_DRAWINGS.full;

    expect(bootLogo?.getAttribute("role")).toBe("img");
    expect(bootLogo?.getAttribute("aria-label")).toBe("typomaniac");
    // Like every drawing of the Logo: a 100 × 100 viewBox, round strokes, no fill.
    expect(bootLogo?.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(bootLogo?.getAttribute("fill")).toBe("none");
    expect(bootLogo?.getAttribute("stroke-linecap")).toBe("round");
    expect(bootLogo?.getAttribute("stroke-linejoin")).toBe("round");
    expect(drawnStrokes(bootLogo)).toEqual([stem, bar, wave]);
  });

  test.each(THEMES.map((theme) => theme.id))(
    "%s, stored, paints the waiting Logo in its text and accent",
    (id) => {
      useThemeStore.getState().setTheme(id);
      boot();
      showBootPage();

      expect(logoStrokeColours()).toEqual(cssLogoStrokeColours(id));
    },
  );

  test.each([
    ["nothing stored", null],
    ["unreadable JSON", "{not json"],
    ["another version", JSON.stringify({ state: { theme: "lagon" }, version: 2 })],
    ["no Theme", JSON.stringify({ state: {}, version: 1 })],
    ["an unknown Theme", JSON.stringify({ state: { theme: "neon" }, version: 1 })],
  ])("%s paints the waiting Logo as Corail", (_, value) => {
    if (value !== null) {
      localStorage.setItem("typomaniac-theme", value);
    }

    boot();
    showBootPage();

    expect(logoStrokeColours()).toEqual(cssLogoStrokeColours("corail"));
  });

  test("index.html keeps one inline script and one inline style, the ones read here", () => {
    expect(parsed.querySelectorAll("script:not([src])")).toHaveLength(1);
    expect(parsed.querySelectorAll("style")).toHaveLength(1);
  });

  test("Papier is the only light one", () => {
    expect(THEMES.flatMap((theme) => (theme.scheme === "light" ? [theme.id] : []))).toEqual([
      "papier",
    ]);
  });
});

/**
 * happy-dom runs no script by default; these tests run the one of index.html, as the browser does.
 * @vitest-environment-options { "settings": { "enableJavaScriptEvaluation": true } }
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import page from "@/../index.html?raw";

// index.html sets <html lang> before the app loads, reading the Locale store's entry by itself:
// these tests keep the two in step with the router's resolution.
const bootScript =
  new DOMParser().parseFromString(page, "text/html").querySelector("script:not([src])")
    ?.textContent ?? "";

// Loads the page at `path`: runs the inline script, as the browser does before anything else,
// with Vite's DEV placeholder written as a dev build (English open) or a production one.
const boot = (path: string, build: "dev" | "production" = "dev") => {
  const script = document.createElement("script");

  history.replaceState(null, "", path);
  script.textContent = bootScript.replaceAll("%DEV%", String(build === "dev"));
  document.head.append(script);
  script.remove();

  return document.documentElement.lang;
};

const keep = (chosen: string) =>
  localStorage.setItem("typomaniac-locale", JSON.stringify({ state: { chosen }, version: 1 }));

const speaks = (languages: string[]) =>
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
  speaks([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  history.replaceState(null, "", "/");
});

describe("<html lang> before the app loads", () => {
  test("is the URL's Locale, whatever is kept", () => {
    keep("fr");

    expect(boot("/en/leaderboard")).toBe("en");
  });

  test("else the Locale kept", () => {
    keep("en");
    speaks(["fr"]);

    expect(boot("/u/ada")).toBe("en");
  });

  test("else the browser's: French when it comes before English", () => {
    speaks(["de", "fr-CA", "en"]);

    expect(boot("/")).toBe("fr");
  });

  test("else English", () => {
    speaks(["de"]);

    expect(boot("/")).toBe("en");
  });

  test("ignores a Locale kept that it does not know, or cannot read", () => {
    speaks(["fr"]);
    keep("de");
    expect(boot("/")).toBe("fr");

    localStorage.setItem("typomaniac-locale", "{not json");
    expect(boot("/")).toBe("fr");
  });

  test("ignores a blocked storage", () => {
    speaks(["fr"]);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(boot("/")).toBe("fr");
  });

  test("is French for all in a production build, until English opens", () => {
    speaks(["en"]);
    keep("en");

    expect(boot("/en/leaderboard", "production")).toBe("fr");
  });
});

import { describe, expect, test } from "vitest";

import { browserLocale } from "@/locale/browser-locale";

describe("browserLocale", () => {
  test("French when a French language comes before any English one", () => {
    expect(browserLocale(["fr-FR", "en-US"])).toBe("fr");
    expect(browserLocale(["de", "fr"])).toBe("fr");
    expect(browserLocale(["FR-ca"])).toBe("fr");
  });

  test("English when an English language comes first", () => {
    expect(browserLocale(["en-GB", "fr"])).toBe("en");
  });

  test("English when the browser speaks neither, or says nothing", () => {
    expect(browserLocale(["de"])).toBe("en");
    expect(browserLocale([])).toBe("en");
  });

  test("a language merely starting like French is not French", () => {
    expect(browserLocale(["fry", "fr"])).toBe("fr");
    expect(browserLocale(["fry"])).toBe("en");
  });
});

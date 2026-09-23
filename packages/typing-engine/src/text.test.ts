import { describe, expect, test } from "bun:test";

import { generateText, wordLists } from "./index";

describe("generateText", () => {
  test("the same Seed and Language always give the same Text", () => {
    expect(generateText(42, "en", 50)).toEqual(generateText(42, "en", 50));
  });

  // Fails as soon as the word list or the draw changes, which rewrites every Seed's Text:
  // such a change must be deliberate (ADR 0002).
  test("Seed 42 in English is pinned", () => {
    expect(generateText(42, "en", 10).join(" ")).toBe(
      "small help while late letter sell driver quiet never learn",
    );
  });

  test("Seed 42 in French is pinned", () => {
    expect(generateText(42, "fr", 10).join(" ")).toBe(
      "fort marcher couleur dans mur vieux nez plein heure chercher",
    );
  });

  test("the same Seed gives a different Text in each Language, drawn from its own list", () => {
    const english = generateText(42, "en", 25);
    const french = generateText(42, "fr", 25);

    expect(french).not.toEqual(english);
    expect(english.every((word) => wordLists.en.includes(word))).toBe(true);
    expect(french.every((word) => wordLists.fr.includes(word))).toBe(true);
  });

  test("two different Seeds give different Texts", () => {
    expect(generateText(1, "en", 10)).not.toEqual(generateText(2, "en", 10));
  });

  test("the word at index i does not depend on the Text length", () => {
    expect(generateText(7, "en", 100).slice(0, 10)).toEqual(generateText(7, "en", 10));
  });

  test("a Text has the requested number of words, all from the Language", () => {
    const text = generateText(3, "en", 25);

    expect(text).toHaveLength(25);
    expect(text.every((word) => wordLists.en.includes(word))).toBe(true);
  });

  test("never the same word twice in a row", () => {
    for (let seed = 0; seed < 200; seed++) {
      const text = generateText(seed, "en", 100);

      text.slice(1).forEach((word, i) => expect(word).not.toBe(text[i]));
    }
  });
});

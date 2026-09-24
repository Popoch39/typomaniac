import { describe, expect, test } from "bun:test";

import { currentWordListVersion, generateText, type Language, wordList } from "./index";

const en = currentWordListVersion.en;

describe("generateText", () => {
  test("the same Seed, Language and Word list version always give the same Text", () => {
    expect(generateText(42, "en", en, 50)).toEqual(generateText(42, "en", en, 50));
  });

  // Version 1 is released: these Texts must never change, even once newer versions exist, or
  // the Keystrokes recorded on them would no longer replay.
  test("Seed 42 in English, version 1, is pinned", () => {
    expect(generateText(42, "en", 1, 10).join(" ")).toBe(
      "small help while late letter sell driver quiet never learn",
    );
  });

  test("Seed 42 in French, version 1, is pinned", () => {
    expect(generateText(42, "fr", 1, 10).join(" ")).toBe(
      "fort marcher couleur dans mur vieux nez plein heure chercher",
    );
  });

  test.each<Language>(["en", "fr"])(
    "every %s version up to the current one is generable",
    (language) => {
      for (let version = 1; version <= currentWordListVersion[language]; version++) {
        const text = generateText(42, language, version, 25);

        expect(text.every((word) => wordList(language, version).includes(word))).toBe(true);
      }
    },
  );

  test("a Word list version that does not exist is refused", () => {
    expect(() => generateText(42, "en", 0, 10)).toThrow(RangeError);
    expect(() => generateText(42, "en", en + 1, 10)).toThrow(RangeError);
    expect(() => generateText(42, "en", 1.5, 10)).toThrow(RangeError);
  });

  test("the same Seed gives a different Text in each Language, drawn from its own list", () => {
    const fr = currentWordListVersion.fr;
    const english = generateText(42, "en", en, 25);
    const french = generateText(42, "fr", fr, 25);

    expect(french).not.toEqual(english);
    expect(english.every((word) => wordList("en", en).includes(word))).toBe(true);
    expect(french.every((word) => wordList("fr", fr).includes(word))).toBe(true);
  });

  test("two different Seeds give different Texts", () => {
    expect(generateText(1, "en", en, 10)).not.toEqual(generateText(2, "en", en, 10));
  });

  test("the word at index i does not depend on the Text length", () => {
    expect(generateText(7, "en", en, 100).slice(0, 10)).toEqual(generateText(7, "en", en, 10));
  });

  test("a Text has the requested number of words, all from the Language", () => {
    const text = generateText(3, "en", en, 25);

    expect(text).toHaveLength(25);
    expect(text.every((word) => wordList("en", en).includes(word))).toBe(true);
  });

  test("never the same word twice in a row", () => {
    for (let seed = 0; seed < 200; seed++) {
      const text = generateText(seed, "en", en, 100);

      text.slice(1).forEach((word, i) => expect(word).not.toBe(text[i]));
    }
  });
});

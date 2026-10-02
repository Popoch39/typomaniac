import { describe, expect, test } from "bun:test";

import { currentWordListVersion, type Language, latestWordListVersion, wordList } from "./index";
import { enV2 } from "./words/en-v2";

const sizes = new Map([
  ["en v1", 200],
  ["en v2", 1000],
  ["fr v1", 200],
]);

const lists = (["en", "fr"] satisfies Language[]).flatMap((language) =>
  Array.from({ length: latestWordListVersion[language] }, (_, i) => ({
    name: `${language} v${i + 1}`,
    words: wordList(language, i + 1),
  })),
);

describe.each(lists)("the $name word list", ({ name, words }) => {
  test("has its released number of words", () => {
    expect(words).toHaveLength(sizes.get(name) ?? 0);
  });

  test("has no duplicates", () => {
    expect(new Set(words).size).toBe(words.length);
  });

  test("only uses lowercase a to z, from 2 to 10 letters", () => {
    expect(words.filter((word) => !/^[a-z]{2,10}$/.test(word))).toEqual([]);
  });
});

describe("English version 2", () => {
  test("weighs its 100 most frequent words 4, the next 300 2 and the last 600 1", () => {
    expect(enV2.map(({ weight, words }) => [weight, words.length])).toEqual([
      [4, 100],
      [2, 300],
      [1, 600],
    ]);
  });

  test("gives every word one whole weight of at least 1, in the list's order", () => {
    expect(enV2.every(({ weight }) => Number.isInteger(weight) && weight >= 1)).toBe(true);
    expect(enV2.flatMap(({ words }) => words)).toEqual([...wordList("en", 2)]);
  });
});

test.each<Language>(["en", "fr"])("the current %s version is one the engine knows", (language) => {
  expect(currentWordListVersion[language]).toBeGreaterThanOrEqual(1);
  expect(currentWordListVersion[language]).toBeLessThanOrEqual(latestWordListVersion[language]);
});

import { describe, expect, test } from "bun:test";

import { currentWordListVersion, type Language, wordList } from "./index";

const lists = (["en", "fr"] satisfies Language[]).flatMap((language) =>
  Array.from({ length: currentWordListVersion[language] }, (_, i) => ({
    name: `${language} v${i + 1}`,
    words: wordList(language, i + 1),
  })),
);

describe.each(lists)("the $name word list", ({ words }) => {
  test("has 200 words", () => {
    expect(words).toHaveLength(200);
  });

  test("has no duplicates", () => {
    expect(new Set(words).size).toBe(words.length);
  });

  test("only uses lowercase a to z", () => {
    expect(words.filter((word) => !/^[a-z]+$/.test(word))).toEqual([]);
  });
});

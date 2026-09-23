import { describe, expect, test } from "bun:test";

import { wordLists } from "./index";

describe.each(Object.entries(wordLists))("the %s word list", (_, words) => {
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

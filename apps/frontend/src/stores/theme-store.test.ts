import { beforeEach, describe, expect, test } from "vitest";

import { useThemeStore } from "@/stores/theme-store";

const storageKey = "typomaniac-theme";

const stored = () => JSON.parse(localStorage.getItem(storageKey) ?? "null");

// Reloads the page: the store starts over from its defaults, then reads what is stored. Resetting
// the store writes its defaults down, so what was stored is put back first.
const reload = async (value: string) => {
  useThemeStore.setState(useThemeStore.getInitialState());
  localStorage.setItem(storageKey, value);
  await useThemeStore.persist.rehydrate();
};

beforeEach(() => {
  localStorage.clear();
  useThemeStore.setState(useThemeStore.getInitialState());
});

describe("the Theme store", () => {
  test("keeps the Theme chosen under its id", () => {
    useThemeStore.getState().setTheme("lagoon");

    expect(stored()).toEqual({ state: { theme: "lagoon" }, version: 2 });
  });

  // What version 1 stored, before the Themes had English ids.
  test.each([
    ["corail", "coral"],
    ["lagon", "lagoon"],
    ["matcha", "matcha"],
    ["lilas", "lilac"],
    ["sakura", "sakura"],
    ["arcade", "arcade"],
    ["craie", "chalk"],
    ["papier", "paper"],
  ])("%s, kept before, comes back as %s, and is stored so", async (before, after) => {
    await reload(JSON.stringify({ state: { theme: before }, version: 1 }));

    expect(useThemeStore.getState().theme).toBe(after);
    expect(stored()).toEqual({ state: { theme: after }, version: 2 });
  });

  test.each([
    ["an unknown Theme, kept before", JSON.stringify({ state: { theme: "neon" }, version: 1 })],
    ["no Theme, kept before", JSON.stringify({ state: {}, version: 1 })],
    ["a former id, stored now", JSON.stringify({ state: { theme: "corail" }, version: 2 })],
  ])("%s gives Coral back", async (_, value) => {
    await reload(value);

    expect(useThemeStore.getState().theme).toBe("coral");
  });
});

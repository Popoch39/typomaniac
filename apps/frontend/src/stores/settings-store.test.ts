import { beforeEach, describe, expect, test } from "vitest";

import { useLocaleStore } from "@/stores/locale-store";
import { useRunStore } from "@/stores/run-store";
import { useSettingsStore } from "@/stores/settings-store";

const storageKey = "typomaniac-settings";

const stored = () => JSON.parse(localStorage.getItem(storageKey) ?? "null");

// Reloads the page: the store starts over from its defaults, then reads what is stored. Resetting
// the store writes its defaults down, so what was stored is put back first.
const reload = async (value: string) => {
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.setItem(storageKey, value);
  await useSettingsStore.persist.rehydrate();
};

// What version 1 stored: the Language always there, English until one was chosen.
const version1 = (language: string) =>
  JSON.stringify({ state: { mode: "words", seconds: 60, words: 25, language }, version: 1 });

// The Language of the Run drawn for the settings.
const runLanguage = () => useRunStore.getState().run.config.language;

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

describe("the settings store", () => {
  test("keeps the Language absent until one is chosen", () => {
    useSettingsStore.getState().setMode("words");

    expect(stored()).toEqual({
      state: { mode: "words", seconds: 30, words: 10, language: null },
      version: 2,
    });
  });

  test("keeps the Language chosen", () => {
    useSettingsStore.getState().setLanguage("fr");

    expect(stored()).toEqual({
      state: { mode: "time", seconds: 30, words: 10, language: "fr" },
      version: 2,
    });
  });

  test("English, kept by version 1 as its default, comes back absent, and is stored so", async () => {
    await reload(version1("en"));

    expect(useSettingsStore.getState().language).toBeNull();
    expect(useSettingsStore.getState().words).toBe(25);
    expect(stored()).toEqual({
      state: { mode: "words", seconds: 60, words: 25, language: null },
      version: 2,
    });
  });

  test("French, chosen under version 1, comes back chosen", async () => {
    await reload(version1("fr"));

    expect(useSettingsStore.getState().language).toBe("fr");
    expect(stored()).toEqual({
      state: { mode: "words", seconds: 60, words: 25, language: "fr" },
      version: 2,
    });
  });

  test("settings of version 1 that do not check out give the defaults back", async () => {
    await reload(version1("de"));

    expect(useSettingsStore.getState()).toMatchObject({
      mode: "time",
      seconds: 30,
      words: 10,
      language: null,
    });
  });
});

describe("the Language of the Runs", () => {
  test("absent, is the Locale's, and follows it", () => {
    expect(runLanguage()).toBe("fr");

    useLocaleStore.setState({ locale: "en" });

    expect(runLanguage()).toBe("en");

    useLocaleStore.setState({ locale: "fr" });

    expect(runLanguage()).toBe("fr");
  });

  test("chosen, survives a change of Locale", () => {
    useSettingsStore.getState().setLanguage("fr");
    useLocaleStore.setState({ locale: "en" });

    expect(runLanguage()).toBe("fr");
  });

  test("chosen, draws a new Run in it", () => {
    useLocaleStore.setState({ locale: "en" });
    useSettingsStore.getState().setLanguage("fr");

    expect(runLanguage()).toBe("fr");
  });
});

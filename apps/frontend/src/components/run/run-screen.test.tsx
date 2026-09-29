import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  currentWordListVersion,
  defaultPace,
  type Language,
  type RunConfig,
  wordList,
} from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { ClockContext } from "@/components/run/clock-context";
import { RunScreen } from "@/components/run/run-screen";
import { useLocaleStore } from "@/stores/locale-store";
import { useRunStore } from "@/stores/run-store";
import { useSettingsStore } from "@/stores/settings-store";

// Seed 42 in English, version 1, gives this Text (pinned in the typing-engine tests).
const text = "small help while late letter sell driver quiet never learn";

const words10: RunConfig = {
  mode: "words",
  words: 10,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

const time30: RunConfig = {
  mode: "time",
  seconds: 30,
  language: "en",
  wordListVersion: 1,
  seed: 42,
};

// The solo draws every Text from the current Word list version of its Language.
const currentWords = (language: Language) => wordList(language, currentWordListVersion[language]);

// Simulated timers drive the animation frames; the time itself comes from the injected clock.
// Other timers stay real: Testing Library waits on a real setTimeout after each user event.
// Every test starts on a first visit: nothing stored, default settings.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  localStorage.clear();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Renders the page with a clock the test moves by hand, frames included. The Session and Pace cache
// is seeded the way the root route's beforeLoad leaves it, for a Visitor unless `me` is given.
const renderPage = ({ me = null, pace = defaultPace }: { me?: Me | null; pace?: number } = {}) => {
  let now = 1_000;
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(paceQueryOptions(me).queryKey, pace);

  render(
    <QueryClientProvider client={queryClient}>
      <ClockContext value={() => now}>
        {/* Stands for the header: its buttons come before the Run in the tab order. */}
        <button type="button">en-tête</button>
        <RunScreen />
      </ClockContext>
    </QueryClientProvider>,
  );

  return {
    user: userEvent.setup(),
    advance: (ms: number) => {
      now += ms;
      act(() => vi.advanceTimersByTime(ms));
    },
  };
};

// Starts a fresh Run on Seed 42 (`words` 10 unless told otherwise), then renders the page.
const renderRun = (config: RunConfig = words10, session: Parameters<typeof renderPage>[0] = {}) => {
  useRunStore.getState().start(config);

  return renderPage(session);
};

// A word is split into one element per letter: match the element that holds them all.
const isWord = (word: string) => (_: string, element: Element | null) =>
  element !== null && element.children.length > 0 && element.textContent === word;

// Its letters only: a Wrong word holds its wave too.
const letterStatuses = (word: string) =>
  Array.from(screen.getByText(isWord(word)).querySelectorAll("[data-status]"), (letter) =>
    letter.getAttribute("data-status"),
  );

// Whether the word is highlighted as the last Burst.
const isBurst = (word: string) => screen.getByText(isWord(word)).dataset.burst === "true";

// Whether the word is a Wrong word, underlined with its wave.
const isWrong = (word: string) => screen.getByText(isWord(word)).dataset.wrong !== undefined;

const stat = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

const resumePrompt = () => screen.queryByRole("button", { name: "clique ou tape pour reprendre" });

const typingInput = () => screen.getByLabelText("Zone de frappe");

// The words of the Text on screen, in order, read from their letters.
const shownWords = () =>
  Array.from(
    new Set(
      Array.from(document.querySelectorAll("[data-status]"), (letter) => letter.parentElement),
    ),
    (word) => word?.textContent ?? "",
  );

// Whether the page shows the Text of Seed 42: its first ten words, in order. Another Text may hold
// some of them too, even twice.
const showsSeed42Text = () => shownWords().slice(0, 10).join(" ") === text;

describe("the Run", () => {
  test("shows the Text to type and the word counter", () => {
    renderRun();

    expect(screen.getByRole("heading", { level: 1, name: "Entraînement" })).toBeInTheDocument();

    for (const word of text.split(" ")) {
      expect(screen.getByText(isWord(word))).toBeInTheDocument();
    }

    expect(screen.getByText("0/10")).toBeInTheDocument();
  });

  test("colors each typed letter right or wrong, and counts validated words", async () => {
    const { user } = renderRun();

    await user.keyboard("sn");

    expect(letterStatuses("small")).toEqual([
      "correct",
      "incorrect",
      "pending",
      "pending",
      "pending",
    ]);

    await user.keyboard("all ");

    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  test("shows every letter state apart: right, wrong, extra, missed and not typed yet", async () => {
    const { user } = renderRun();

    await user.keyboard("sma helpx whxle");

    expect(letterStatuses("small")).toEqual(["correct", "correct", "correct", "missed", "missed"]);
    expect(letterStatuses("helpx")).toEqual(["correct", "correct", "correct", "correct", "extra"]);
    expect(letterStatuses("while")).toEqual([
      "correct",
      "correct",
      "incorrect",
      "correct",
      "correct",
    ]);
    expect(letterStatuses("late")).toEqual(["pending", "pending", "pending", "pending"]);
  });

  test("a word validated with a wrong, an extra or skipped letters is a Wrong word", async () => {
    const { user } = renderRun();

    await user.keyboard("sma helpx whxle lxt");

    expect(isWrong("small")).toBe(true);
    expect(isWrong("helpx")).toBe(true);
    expect(isWrong("while")).toBe(true);
    // Still being typed: its mistake can be taken back.
    expect(isWrong("late")).toBe(false);
  });

  test("a right word, or one corrected before the space, is no Wrong word", async () => {
    const { user } = renderRun();

    await user.keyboard("small hx{Backspace}elp ");

    expect(isWrong("small")).toBe(false);
    expect(isWrong("help")).toBe(false);
  });

  test("backspace reopens a Wrong word, which is one again only if validated wrong", async () => {
    const { user } = renderRun();

    await user.keyboard("smalx ");

    expect(isWrong("small")).toBe(true);

    await user.keyboard("{Backspace}");

    expect(isWrong("small")).toBe(false);

    await user.keyboard(" ");

    expect(isWrong("small")).toBe(true);

    await user.keyboard("{Backspace}{Backspace}l ");

    expect(isWrong("small")).toBe(false);
  });

  test("backspace corrects the current word, then goes back to a wrong previous word", async () => {
    const { user } = renderRun();

    await user.keyboard("smallx {Backspace}");

    expect(screen.getByText("0/10")).toBeInTheDocument();

    await user.keyboard("{Backspace} help");

    expect(letterStatuses("small").every((status) => status === "correct")).toBe(true);
    expect(screen.getByText("1/10")).toBeInTheDocument();

    // "small" is right now: backspace stops at the start of "help".
    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}");

    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  test("Ctrl+Backspace erases the current word", async () => {
    const { user } = renderRun();

    await user.keyboard("smoll{Control>}{Backspace}{/Control}");

    expect(letterStatuses("small")).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  test("a full Run ends on its Result", async () => {
    const { user, advance } = renderRun();

    await user.keyboard(text.slice(0, -1));
    advance(60_000);
    await user.keyboard(text.slice(-1));

    // 49 letters and 9 spaces, all right, in one minute: 58 / 5 = 11.6 wpm, and as much raw.
    expect(stat("wpm")).toBe("12");
    expect(stat("raw")).toBe("12");
    expect(stat("précision")).toBe("100 %");
    // Right, wrong, extra and missed letters.
    expect(stat("caractères")).toBe("49/0/0/0");
    expect(screen.queryByText(isWord("small"))).not.toBeInTheDocument();
  });

  // The clock does not move: every word of 4 letters or more is a Burst, its points doubled.
  // "small " 6 + "help " 5 + "while " 6 + "late " 5 at x1, then "letter " 7 at x2, all doubled.
  test("shows the Score, the multiplier and the Combo while typing", async () => {
    const { user } = renderRun();

    await user.keyboard("small help while late ");

    // The multiplier shown is the one of the word in progress: the 5th is paid x2.
    expect(stat("score")).toBe("44");
    expect(stat("multiplicateur")).toBe("x2");

    await user.keyboard("letter ");

    expect(stat("score")).toBe("72");
    expect(stat("multiplicateur")).toBe("x2");
    expect(stat("combo")).toBe("5");

    await user.keyboard("x");

    expect(stat("score")).toBe("72");
    expect(stat("multiplicateur")).toBe("x1");
    expect(stat("combo")).toBe("0");
  });

  // At the default Pace of 50 wpm, a Burst goes at 60 wpm or more.
  test("a Burst doubles the points of a word and highlights it", async () => {
    const { user, advance } = renderRun();

    await user.keyboard("small ");

    expect(stat("score")).toBe("12");
    expect(stat("bursts")).toBe("1");
    expect(isBurst("small")).toBe(true);

    // "help " takes 5 s: 12 wpm, no Burst. The last one stays highlighted.
    advance(5_000);
    await user.keyboard("help ");

    expect(stat("score")).toBe("17");
    expect(stat("bursts")).toBe("1");
    expect(isBurst("small")).toBe(true);
    expect(isBurst("help")).toBe(false);

    await user.keyboard("while ");

    expect(stat("bursts")).toBe("2");
    expect(isBurst("while")).toBe(true);
    expect(isBurst("small")).toBe(false);
  });

  test("a User's Bursts are judged against the Pace of their Duels", async () => {
    const me = {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      handle: "ada",
      rank: null,
      ornament: null,
      ornamentChoice: null,
    };

    // At a Pace of 500 wpm, a Burst takes 600 wpm: "help " in 150 ms, 400 wpm, is not one, when it
    // would be at the default Pace.
    const { user, advance } = renderRun(words10, { me, pace: 500 });

    await user.keyboard("small ");
    advance(150);
    await user.keyboard("help ");

    expect(stat("bursts")).toBe("1");
    expect(isBurst("small")).toBe(true);
    expect(isBurst("help")).toBe(false);
  });

  // Four words at x1 (22), then "letter " 7, "sell " 5, "driver " 7, "quiet " 6, "never " 6 at
  // x2 (62), then "learn" 5, the last word without a space, at x3 (15): 99, every word a Burst.
  test("the Result shows the Score, the best Combo and the Bursts", async () => {
    const { user } = renderRun();

    await user.keyboard(text);

    expect(stat("score")).toBe("198");
    expect(stat("meilleur combo")).toBe("10");
    expect(stat("bursts")).toBe("10");
  });
});

// The line that tells the keys to Suivant, its keys in their own elements.
const keysHint = () =>
  screen.getByText(
    (_, element) => element?.tagName === "P" && element.textContent === "tab puis entrée : Suivant",
  );

describe("the Run, between Runs", () => {
  test("Rejouer starts the same Text again", async () => {
    const { user } = renderRun();

    await user.keyboard(text);
    await user.click(screen.getByRole("button", { name: "Rejouer" }));

    expect(showsSeed42Text()).toBe(true);
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(typingInput()).toHaveFocus();
  });

  test("Suivant starts another Text, in the same Mode", async () => {
    const { user } = renderRun();

    await user.keyboard(text);
    await user.click(screen.getByRole("button", { name: "Suivant" }));

    expect(showsSeed42Text()).toBe(false);
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(typingInput()).toHaveFocus();
  });

  test("Tab then Enter starts the next Run from the Result", async () => {
    const { user } = renderRun();

    await user.keyboard(text);
    await user.tab();
    await user.keyboard("{Enter}");

    expect(showsSeed42Text()).toBe(false);
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(typingInput()).toHaveFocus();
  });

  test("Tab then Enter starts the next Run during a Run", async () => {
    const { user } = renderRun();

    await user.keyboard("small hel");
    await user.tab();
    await user.keyboard("{Enter}");

    expect(showsSeed42Text()).toBe(false);
    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();
  });

  test("the keys to Suivant are told at the foot of the page, during the Run and on its Result", async () => {
    const { user } = renderRun();

    expect(keysHint()).toBeInTheDocument();

    await user.keyboard(text);

    expect(screen.getByText("wpm")).toBeInTheDocument();
    expect(keysHint()).toBeInTheDocument();
  });
});

const timeLeft = () => screen.getByRole("timer", { name: "temps restant" });

describe("the Run in time Mode", () => {
  test("a first Run is a time 30 Run", () => {
    useRunStore.setState(useRunStore.getInitialState());
    renderPage();

    expect(timeLeft()).toHaveTextContent("30");
    expect(screen.queryByText("0/10")).not.toBeInTheDocument();
  });

  test("the clock only starts on the first Keystroke", async () => {
    const { user, advance } = renderRun(time30);

    advance(5_000);

    expect(timeLeft()).toHaveTextContent("30");

    await user.keyboard("s");
    advance(1_000);

    expect(timeLeft()).toHaveTextContent("29");

    advance(18_500);

    expect(timeLeft()).toHaveTextContent("11");
  });

  // Seed 42 goes on with "brother" after its tenth word.
  test("the Text does not stop after ten words", async () => {
    const { user } = renderRun(time30);

    await user.keyboard(`${text} brother`);

    expect(letterStatuses("brother").every((status) => status === "correct")).toBe(true);
    expect(timeLeft()).toHaveTextContent("30");
  });

  // The time is up on "wh", 2 letters into "while", which count in wpm:
  // "small " + "help " + "wh" = 13 chars in 30 s, so 13 / 5 / 0.5 = 5.2.
  test("the Run ends when the time is up, on its Result", async () => {
    const { user, advance } = renderRun(time30);

    await user.keyboard("small help wh");
    advance(29_000);

    expect(timeLeft()).toHaveTextContent("1");

    advance(1_000);

    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(stat("wpm")).toBe("5");
    expect(stat("précision")).toBe("100 %");
    // All 13 chars in the first second, none in the 29 others: a raw of 156, then 0. The mean is
    // 5.2 and the deviation 28, so c ≈ 5.4 and tanh(c + c³/3 + c⁵/5) rounds to 1.
    expect(stat("régularité")).toBe("0 %");
    // "small " and "help " are Bursts at x1, and the word in progress pays its right letters too,
    // never doubled: 12 + 10 + 2.
    expect(stat("score")).toBe("24");
  });

  test("the time keeps running out while the focus is lost", async () => {
    const { user, advance } = renderRun(time30);

    await user.keyboard("small help wh");
    await user.click(document.body);
    advance(10_000);

    expect(timeLeft()).toHaveTextContent("20");

    advance(20_000);

    expect(stat("wpm")).toBe("5");
  });
});

describe("the Run's focus", () => {
  test("losing the focus hides the Text behind a prompt to resume", async () => {
    const { user } = renderRun();

    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();

    await user.click(document.body);

    expect(resumePrompt()).toBeInTheDocument();
  });

  test("a click on the Text gives the focus back", async () => {
    const { user } = renderRun();

    await user.click(document.body);
    await user.click(screen.getByRole("button", { name: "clique ou tape pour reprendre" }));

    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();

    await user.keyboard("s");

    expect(letterStatuses("small")[0]).toBe("correct");
  });

  test("a key gives the focus back without being typed", async () => {
    const { user } = renderRun();

    await user.click(document.body);
    await user.keyboard("x");

    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();
    expect(letterStatuses("small")[0]).toBe("pending");
  });

  test("a key typed on a focused button gives the focus back too", async () => {
    const { user } = renderRun();

    await user.click(document.body);
    // Backwards from the page, Suivant is the first stop, then the overlay.
    await user.tab({ shift: true });
    await user.tab({ shift: true });

    expect(resumePrompt()).toHaveFocus();

    await user.keyboard("x");

    expect(typingInput()).toHaveFocus();
  });

  test("the clock keeps running while the focus is lost", async () => {
    const { user, advance } = renderRun();

    await user.keyboard("small help while late letter");
    await user.click(document.body);
    advance(60_000);
    await user.click(screen.getByRole("button", { name: "clique ou tape pour reprendre" }));
    await user.keyboard(" sell driver quiet never learn");

    // Same Run as above, typed in one minute because the minute out of focus counts.
    expect(stat("wpm")).toBe("12");
  });
});

const setting = (name: string) => screen.getByRole("button", { name });

const settingsBar = () => screen.queryByRole("group", { name: "Réglages" });

type StoredSettings = { mode: string; seconds: number; words: number; language: string };

// Fills the storage as an earlier visit would have.
const storeSettings = (state: StoredSettings) =>
  localStorage.setItem("typomaniac-settings", JSON.stringify({ state, version: 1 }));

// Loads the page afresh, as a reload does: every store is created again from the storage.
const reload = async () => {
  cleanup();
  vi.resetModules();
  const { useLocaleStore: reloadedLocaleStore } = await import("@/stores/locale-store");

  // The page reloads in the Locale shown before, as its URL keeps it.
  reloadedLocaleStore.setState({ locale: useLocaleStore.getState().locale });
  const { RunScreen: ReloadedPage } = await import("@/components/run/run-screen");
  const query = await import("@tanstack/react-query");
  const queryClient = new query.QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, null);
  queryClient.setQueryData(paceQueryOptions(null).queryKey, defaultPace);

  render(
    <query.QueryClientProvider client={queryClient}>
      <ReloadedPage />
    </query.QueryClientProvider>,
  );

  return { user: userEvent.setup() };
};

const unavailable = () => {
  throw new DOMException("The storage is disabled.", "SecurityError");
};

describe("the Run's settings", () => {
  test("a first visit is set to time 30 in the Language of the Locale", () => {
    useRunStore.setState(useRunStore.getInitialState());
    renderPage();

    expect(setting("time")).toHaveAttribute("aria-pressed", "true");
    expect(setting("30")).toHaveAttribute("aria-pressed", "true");
    expect(setting("français")).toHaveAttribute("aria-pressed", "true");
    expect(setting("words")).toHaveAttribute("aria-pressed", "false");
  });

  test("the Language, never chosen, follows the Locale", () => {
    renderPage();

    act(() => useLocaleStore.setState({ locale: "en" }));

    expect(setting("English")).toHaveAttribute("aria-pressed", "true");
    expect(shownWords().every((word) => currentWords("en").includes(word))).toBe(true);
  });

  test("a Language chosen stays whatever the Locale", async () => {
    const { user } = renderPage();

    await user.click(setting("français"));
    act(() => useLocaleStore.setState({ locale: "en" }));

    expect(setting("French")).toHaveAttribute("aria-pressed", "true");
    expect(shownWords().every((word) => currentWords("fr").includes(word))).toBe(true);
  });

  test("English, kept before as the default, follows the Locale", async () => {
    storeSettings({ mode: "time", seconds: 30, words: 10, language: "en" });
    await reload();

    expect(setting("français")).toHaveAttribute("aria-pressed", "true");
    expect(shownWords().every((word) => currentWords("fr").includes(word))).toBe(true);
  });

  test.each(["15", "30", "60", "120"])("time %s s can be chosen", async (seconds) => {
    const { user } = renderPage();

    await user.click(setting(seconds));

    expect(setting(seconds)).toHaveAttribute("aria-pressed", "true");
    expect(timeLeft()).toHaveTextContent(seconds);
  });

  test.each(["10", "25", "50", "100"])("words %s can be chosen", async (words) => {
    const { user } = renderPage();

    await user.click(setting("words"));
    await user.click(setting(words));

    expect(setting("words")).toHaveAttribute("aria-pressed", "true");
    expect(setting(words)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(`0/${words}`)).toBeInTheDocument();
  });

  test("no Solo or Duel to choose: a Duel is launched from Jouer", () => {
    renderPage();

    expect(screen.queryByRole("group", { name: "Jeu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "duel" })).not.toBeInTheDocument();
    expect(setting("time")).toBeInTheDocument();
  });

  test("the settings are hidden during a Run and come back on its Result", async () => {
    const { user } = renderRun();

    expect(settingsBar()).toBeInTheDocument();

    await user.keyboard("s");

    expect(settingsBar()).not.toBeInTheDocument();

    await user.keyboard(text.slice(1));

    expect(screen.getByText("wpm")).toBeInTheDocument();
    expect(settingsBar()).toBeInTheDocument();
  });

  test("changing a setting on the Result starts a new Run on it", async () => {
    const { user } = renderRun();

    await user.keyboard(text);
    await user.click(setting("15"));

    expect(screen.queryByText("wpm")).not.toBeInTheDocument();
    expect(timeLeft()).toHaveTextContent("15");
    expect(typingInput()).toHaveFocus();
  });

  test("changing a setting before typing draws a new Text", async () => {
    const { user } = renderRun(time30);

    await user.click(setting("60"));

    expect(showsSeed42Text()).toBe(false);
    expect(timeLeft()).toHaveTextContent("60");
  });

  test("the settings are restored from the storage on reload", async () => {
    storeSettings({ mode: "words", seconds: 60, words: 25, language: "fr" });
    await reload();

    expect(setting("words")).toHaveAttribute("aria-pressed", "true");
    expect(setting("25")).toHaveAttribute("aria-pressed", "true");
    expect(setting("français")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("0/25")).toBeInTheDocument();
    expect(shownWords().every((word) => currentWords("fr").includes(word))).toBe(true);
  });

  test("the settings chosen are stored for the next visit", async () => {
    const { user } = renderPage();

    await user.click(setting("words"));
    await user.click(setting("50"));
    await reload();

    expect(screen.getByText("0/50")).toBeInTheDocument();
  });

  test("stored settings that do not check out give the defaults back", async () => {
    storeSettings({ mode: "zen", seconds: 7, words: 25, language: "de" });
    await reload();

    expect(setting("time")).toHaveAttribute("aria-pressed", "true");
    expect(timeLeft()).toHaveTextContent("30");
  });

  test("an unavailable storage gives the defaults, and the settings still work", async () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(unavailable);
    vi.spyOn(localStorage, "setItem").mockImplementation(unavailable);
    const errors: ErrorEvent[] = [];
    const collectError = (event: ErrorEvent) => errors.push(event);

    window.addEventListener("error", collectError);
    const { user } = await reload();

    expect(timeLeft()).toHaveTextContent("30");

    await user.click(setting("words"));
    window.removeEventListener("error", collectError);

    expect(screen.getByText("0/10")).toBeInTheDocument();
    expect(errors).toEqual([]);
  });

  test("each Language draws its Text from its own word list", async () => {
    const { user } = renderPage();

    await user.click(setting("français"));

    expect(setting("français")).toHaveAttribute("aria-pressed", "true");
    expect(shownWords().every((word) => currentWords("fr").includes(word))).toBe(true);

    await user.click(setting("anglais"));

    expect(shownWords().every((word) => currentWords("en").includes(word))).toBe(true);
  });
});

describe("the Run in English", () => {
  // Shown before the Run is drawn: the Language, never chosen, is English too.
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("names the page, its settings and the Language in English", async () => {
    const { user } = renderRun();

    expect(screen.getByRole("heading", { level: 1, name: "Training" })).toBeInTheDocument();
    expect(settingsBar()).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Settings" })).toBeInTheDocument();

    for (const group of ["Mode", "Duration", "Language"]) {
      expect(screen.getByRole("group", { name: group })).toBeInTheDocument();
    }

    expect(setting("English")).toHaveAttribute("aria-pressed", "true");
    expect(setting("French")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Sound" })).toBeInTheDocument();

    await user.click(setting("words"));

    expect(screen.getByRole("group", { name: "Word count" })).toBeInTheDocument();
  });

  test("tells the keys to the next Run in English", () => {
    renderRun();

    expect(
      screen.getByText(
        (_, element) => element?.tagName === "P" && element.textContent === "tab then enter: Next",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  test("names the typing input, the prompt to resume and the time left in English", async () => {
    const { user } = renderRun(time30);

    expect(screen.getByLabelText("Typing area")).toHaveFocus();
    expect(screen.getByRole("timer", { name: "time left" })).toHaveTextContent("30");

    await user.click(document.body);

    expect(screen.getByRole("button", { name: "click or type to resume" })).toBeInTheDocument();
  });

  test("shows the Score while typing in English", async () => {
    const { user } = renderRun();

    await user.keyboard("small help while late letter ");

    expect(stat("score")).toBe("72");
    expect(stat("multiplier")).toBe("x2");
    expect(stat("combo")).toBe("5");
    expect(stat("bursts")).toBe("5");
  });

  test("shows the Result in English, the percent sign stuck to its figure", async () => {
    const { user, advance } = renderRun();

    await user.keyboard(text.slice(0, -1));
    advance(60_000);
    await user.keyboard(text.slice(-1));

    expect(stat("wpm")).toBe("12");
    expect(stat("raw")).toBe("12");
    expect(stat("accuracy")).toBe("100%");
    expect(stat("consistency")).toMatch(/^\d+%$/);
    expect(stat("characters")).toBe("49/0/0/0");
    expect(screen.getByText("characters").nextElementSibling).toHaveAttribute(
      "title",
      "correct / incorrect / extra / missed",
    );
    expect(stat("best combo")).toBe("10");
    expect(screen.getByRole("button", { name: "Play again" })).toBeInTheDocument();
  });
});

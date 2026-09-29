import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import type { Keystroke } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { ReplayedDuel, ReplayedPlayer } from "@/api/duel-history";
import { DuelReplay } from "@/components/replay/duel-replay";
import { ClockContext } from "@/components/run/clock-context";
import { ReplayErrorPage } from "@/pages/replay-error-page";
import { useLocaleStore } from "@/stores/locale-store";

// Seed 42 in English, version 1, starts with "small help while" (pinned in the typing-engine tests).
const adaTyped: Keystroke[] = [
  { kind: "char", char: "s", at: 100 },
  { kind: "char", char: "m", at: 200 },
  { kind: "char", char: "x", at: 300 },
  { kind: "backspace", at: 400 },
  { kind: "char", char: "a", at: 500 },
  { kind: "char", char: "l", at: 600 },
  { kind: "char", char: "l", at: 700 },
  { kind: "char", char: " ", at: 800 },
];

const player = (handle: string, keystrokes: Keystroke[], score: number | null): ReplayedPlayer => ({
  handle,
  image: null,
  result: {
    wpm: 42,
    raw: 45,
    accuracy: 96,
    consistency: 80,
    chars: { correct: 21, incorrect: 1, extra: 0, missed: 0 },
  },
  pace: 50,
  score: score === null ? null : { score, bestCombo: 3, bursts: 0 },
  keystrokes,
});

const replayed = (overrides: Partial<ReplayedDuel> = {}): ReplayedDuel => ({
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  // Noon UTC: the 20th in every time zone.
  startsAt: Date.UTC(2026, 8, 20, 12),
  endedAt: Date.UTC(2026, 8, 20, 12, 0, 30, 50),
  outcome: "win",
  forfeit: false,
  ranked: true,
  tp: 18,
  me: player("ada", adaTyped, 1234),
  opponent: player("alan", [{ kind: "char", char: "s", at: 150 }], 567),
  ...overrides,
});

// The Duel of `replayed`, forfeited 0.55 s in by the side that did not win.
const forfeitedAt = (outcome: "win" | "loss", overrides: Partial<ReplayedDuel> = {}) =>
  replayed({
    outcome,
    forfeit: true,
    endedAt: Date.UTC(2026, 8, 20, 12, 0, 0, 550),
    ...overrides,
  });

// Simulated animation frames; the time comes from the injected clock.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// The Replay of `duel`, read from a simulated API, on a clock the test moves by hand.
const renderReplay = async (duel: ReplayedDuel) => {
  let now = 5_000;

  const fetch = vi.fn(
    async (_input: RequestInfo | URL) =>
      new Response(JSON.stringify(duel), { headers: { "content-type": "application/json" } }),
  );

  vi.stubGlobal("fetch", fetch);

  // On a router of its own: the opponent's Handle is a link.
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <DuelReplay duelId={duel.id} /> }),
    history: createMemoryHistory({ initialEntries: [`/duels/${duel.id}`] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ClockContext value={() => now}>
        <Suspense>
          <RouterProvider router={router} />
        </Suspense>
      </ClockContext>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { level: 1 });

  expect(String(fetch.mock.calls[0]?.[0])).toContain(`/api/duels/${duel.id}`);

  return {
    user: userEvent.setup({ advanceTimers: () => undefined }),
    advance: (ms: number) => {
      now += ms;
      act(() => vi.advanceTimersByTime(16));
    },
  };
};

// A word is split into one element per letter: match the element that holds them all.
const isWord = (word: string) => (_: string, element: Element | null) =>
  element !== null && element.children.length > 0 && element.textContent === word;

// Its letters only: a word typed wrong holds its wave too.
const statuses = (word: string) =>
  Array.from(screen.getByText(isWord(word)).querySelectorAll("[data-status]"), (letter) =>
    letter.getAttribute("data-status"),
  );

// The time of the Replay, at the left of the time bar.
const timer = () => screen.getByRole("timer", { name: "Temps de lecture" });

// The carets in the Text by player, `own` or `opponent`: the other side's first, then the one of
// the Run shown.
const carets = () =>
  Array.from(document.querySelectorAll("[data-caret]"), (caret) =>
    caret.getAttribute("data-caret"),
  );

// The slider hides its thumb until it has measured its track, which happy-dom never lays out: its
// name is not computed then, so it is found by its label instead.
const timeline = () => screen.getByLabelText("Temps du Replay", { selector: "input[type=range]" });

// Moves the time bar with the keyboard: Home is the start, each arrow a tenth of a second.
const seek = async (user: ReturnType<typeof userEvent.setup>, keys: string) => {
  timeline().focus();
  await user.keyboard(keys);
};

// The line under the title: when, what kind of Duel, its time and its Language.
const duelFormat = () => screen.getByText(/ · 30 s · anglais$/);

// The Score card of a side: its Score, wpm and Combo, as they show.
const scoreCard = (name: string) => {
  const card = within(screen.getByRole("region", { name: `Score de ${name}` }));

  return ["score", "wpm", "combo"].map(
    (term) => card.getByText(term).nextElementSibling?.textContent,
  );
};

describe("DuelReplay", () => {
  test("titled by the opponent, a link to their Profile, then when and what kind of Duel it was", async () => {
    await renderReplay(replayed());

    const title = screen.getByRole("heading", { level: 1, name: "Replay contre @alan" });

    expect(within(title).getByRole("link", { name: "@alan" })).toHaveAttribute("href", "/u/alan");
    expect(duelFormat()).toHaveTextContent(
      /^20 sept\. 2026, \d\d:\d\d · Duel classé · 30 s · anglais$/,
    );
  });

  test("shows how the Duel ended and the TP it moved", async () => {
    await renderReplay(replayed({ outcome: "loss", forfeit: true, tp: -15 }));

    expect(screen.getByText("Défaite par Forfeit")).toBeInTheDocument();
    expect(screen.getByText("−15 TP")).toBeInTheDocument();
  });

  test("a Challenge says so, without TP", async () => {
    await renderReplay(replayed({ ranked: false, tp: null }));

    expect(duelFormat()).toHaveTextContent("· Challenge ·");
    expect(screen.queryByText(/TP$/)).not.toBeInTheDocument();
  });

  test("a Duel in Placement is a Duel classé that moved no TP", async () => {
    await renderReplay(replayed({ tp: null }));

    expect(duelFormat()).toHaveTextContent("· Duel classé ·");
    expect(screen.queryByText(/TP$/)).not.toBeInTheDocument();
  });

  test("plays the Duel on at the pace of the clock, Keystroke by Keystroke", async () => {
    const { advance } = await renderReplay(replayed());

    expect(statuses("small")).toEqual(["pending", "pending", "pending", "pending", "pending"]);
    expect(timer()).toHaveTextContent("0 s");
    expect(carets()).toEqual(["opponent", "own"]);

    advance(250);

    expect(statuses("small")).toEqual(["correct", "correct", "pending", "pending", "pending"]);

    advance(100);

    // The wrong letter shows until the backspace that erases it.
    expect(statuses("small")).toEqual(["correct", "correct", "incorrect", "pending", "pending"]);

    advance(500);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);

    // 3.05 s in, to the tenth.
    advance(2_200);

    expect(timer()).toHaveTextContent("3,1 s");
  });

  test("the Lecture card holds the time bar between the time and the length of the Replay, and its controls", async () => {
    await renderReplay(replayed());

    const lecture = within(screen.getByRole("region", { name: "Lecture" }));

    expect(lecture.getByRole("timer", { name: "Temps de lecture" })).toHaveTextContent("0 s");
    expect(lecture.getByLabelText("Temps du Replay", { selector: "input" })).toBeInTheDocument();
    expect(lecture.getByText("30 s")).toBeInTheDocument();
    expect(lecture.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(lecture.getByRole("radiogroup", { name: "Vitesse de lecture" })).toBeInTheDocument();
    expect(lecture.getByRole("radiogroup", { name: "Run affiché" })).toBeInTheDocument();
  });

  test("the Score cards follow the Replay: each side's Score, wpm and Combo at that instant", async () => {
    const { advance } = await renderReplay(replayed());

    expect(scoreCard("Toi")).toEqual(["0", "0", "0"]);
    expect(scoreCard("@alan")).toEqual(["0", "0", "0"]);

    // 0.85 s in, Ada has validated « small », corrected on the way: a Combo of 1, paid x1 its 5
    // letters and its space, 6 right chars (85 wpm). Alan has typed his « s » (14 wpm).
    advance(850);

    expect(scoreCard("Toi")).toEqual(["6", "85", "1"]);
    expect(scoreCard("@alan")).toEqual(["0", "14", "0"]);
  });

  test("a pause holds the Run until the Replay resumes", async () => {
    const { user, advance } = await renderReplay(replayed());

    advance(350);
    await user.click(screen.getByRole("button", { name: "Pause" }));
    advance(5_000);

    expect(statuses("small")).toEqual(["correct", "correct", "incorrect", "pending", "pending"]);
    expect(timer()).toHaveTextContent("0,4 s");

    await user.click(screen.getByRole("button", { name: "Lecture" }));
    advance(500);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  test("at the end, both Results and Scores, then it plays again from the start", async () => {
    const { user, advance } = await renderReplay(replayed());

    advance(30_000);

    const own = screen.getByRole("region", { name: "Toi" });
    const opponent = screen.getByRole("region", { name: "@alan" });

    expect(within(own).getByText("score").nextElementSibling).toHaveTextContent("1 234");
    expect(within(opponent).getByText("score").nextElementSibling).toHaveTextContent("567");
    expect(screen.queryByRole("region", { name: "Score de Toi" })).not.toBeInTheDocument();
    expect(timer()).toHaveTextContent("30 s");

    await user.click(screen.getByRole("button", { name: "Revoir depuis le début" }));

    expect(timer()).toHaveTextContent("0 s");
    expect(statuses("small")).toEqual(["pending", "pending", "pending", "pending", "pending"]);
  });

  test("the time bar follows the Replay", async () => {
    const { advance } = await renderReplay(replayed());

    expect(timeline()).toHaveAttribute("aria-valuenow", "0");

    advance(3_050);

    expect(timeline()).toHaveAttribute("aria-valuenow", "3050");
    expect(timeline()).toHaveAttribute("aria-valuetext", "3,1 s sur 30 s");
  });

  test("a seek while paused shows the Run at that instant and stays there", async () => {
    const { user, advance } = await renderReplay(replayed());

    advance(850);
    await user.click(screen.getByRole("button", { name: "Pause" }));
    await seek(user, "{Home}");

    expect(statuses("small")).toEqual(["pending", "pending", "pending", "pending", "pending"]);

    await seek(user, "{ArrowRight>3/}");
    advance(5_000);

    expect(statuses("small")).toEqual(["correct", "correct", "incorrect", "pending", "pending"]);
    expect(timeline()).toHaveAttribute("aria-valuenow", "300");
    expect(screen.getByRole("button", { name: "Lecture" })).toBeInTheDocument();
  });

  test("a seek while playing goes on playing from that instant", async () => {
    const { user, advance } = await renderReplay(replayed());

    advance(2_000);
    await seek(user, "{Home}{ArrowRight>2/}");

    expect(statuses("small")).toEqual(["correct", "correct", "pending", "pending", "pending"]);

    advance(650);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  test("at 2×, the Replay goes twice as fast, from where it stood", async () => {
    const { user, advance } = await renderReplay(replayed());

    expect(screen.getByRole("radio", { name: "1×" })).toBeChecked();

    advance(350);
    await user.click(screen.getByRole("radio", { name: "2×" }));

    expect(statuses("small")).toEqual(["correct", "correct", "incorrect", "pending", "pending"]);

    advance(250);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
    expect(timeline()).toHaveAttribute("aria-valuenow", "850");
  });

  test("at 0,5×, the Replay goes half as fast", async () => {
    const { user, advance } = await renderReplay(replayed());

    await user.click(screen.getByRole("radio", { name: "0,5×" }));
    advance(500);

    expect(statuses("small")).toEqual(["correct", "correct", "pending", "pending", "pending"]);
  });

  test("the opponent's Run shows their letters and their mistakes, without stopping", async () => {
    const { user, advance } = await renderReplay(
      replayed({
        opponent: player(
          "alan",
          [
            { kind: "char", char: "s", at: 150 },
            { kind: "char", char: "x", at: 250 },
            { kind: "backspace", at: 600 },
          ],
          567,
        ),
      }),
    );

    expect(screen.getByRole("radio", { name: "Mon Run" })).toBeChecked();
    expect(screen.getByRole("region", { name: "Mon Run" })).toBeInTheDocument();

    advance(300);
    await user.click(screen.getByRole("radio", { name: "Run de @alan" }));

    expect(screen.getByRole("region", { name: "Run de @alan" })).toBeInTheDocument();
    expect(statuses("small")).toEqual(["correct", "incorrect", "pending", "pending", "pending"]);
    // Each caret keeps its player's colour: the one of the Run shown is Alan's.
    expect(carets()).toEqual(["own", "opponent"]);

    advance(400);

    expect(statuses("small")).toEqual(["correct", "pending", "pending", "pending", "pending"]);
    expect(timeline()).toHaveAttribute("aria-valuenow", "700");

    await user.click(screen.getByRole("radio", { name: "Mon Run" }));

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  test("when the User forfeited, their Run stops at the Forfeit, marked on the time bar", async () => {
    const { advance } = await renderReplay(forfeitedAt("loss"));

    expect(screen.getByText("Toi : abandon à 0,6 s")).toBeInTheDocument();

    advance(540);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "pending", "pending"]);

    // The « l » typed at 0.6 s never shows: the Replay ends at the Forfeit.
    advance(30_000);

    expect(timeline()).toHaveAttribute("aria-valuenow", "550");
    expect(screen.getByRole("region", { name: "Toi" })).toBeInTheDocument();
    expect(screen.getByText("Toi : abandon à 0,6 s")).toBeInTheDocument();
  });

  test("when the opponent forfeited, their Run stops at the Forfeit, whichever Run shows", async () => {
    const { user, advance } = await renderReplay(
      forfeitedAt("win", {
        opponent: player(
          "alan",
          [
            { kind: "char", char: "s", at: 150 },
            { kind: "char", char: "m", at: 500 },
            { kind: "char", char: "a", at: 600 },
          ],
          567,
        ),
      }),
    );

    expect(screen.getByText("@alan : abandon à 0,6 s")).toBeInTheDocument();

    advance(540);
    await user.click(screen.getByRole("radio", { name: "Run de @alan" }));

    expect(statuses("small")).toEqual(["correct", "correct", "pending", "pending", "pending"]);
    expect(screen.getByText("@alan : abandon à 0,6 s")).toBeInTheDocument();

    advance(30_000);

    expect(timeline()).toHaveAttribute("aria-valuenow", "550");
    expect(screen.getByRole("region", { name: "@alan" })).toBeInTheDocument();
    expect(screen.getByText("@alan : abandon à 0,6 s")).toBeInTheDocument();
  });

  test("an opponent who forfeited, then deleted their User, is marked as gone", async () => {
    await renderReplay(forfeitedAt("win", { opponent: null }));

    expect(screen.getByText("User supprimé : abandon à 0,6 s")).toBeInTheDocument();
  });

  test("a Duel ended by its time has no Forfeit marker", async () => {
    await renderReplay(replayed());

    expect(screen.queryByText(/abandon à/)).not.toBeInTheDocument();
  });

  test("once the opponent's User is deleted, only the User's side plays", async () => {
    const { advance } = await renderReplay(replayed({ opponent: null }));

    const title = screen.getByRole("heading", { level: 1, name: "Replay contre User supprimé" });

    expect(within(title).queryByRole("link")).not.toBeInTheDocument();
    expect(scoreCard("Toi")).toEqual(["0", "0", "0"]);
    expect(screen.getAllByRole("region", { name: /^Score de / })).toHaveLength(1);

    advance(850);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
    // Their own caret alone, and nothing to switch to.
    expect(carets()).toEqual(["own"]);
    expect(screen.queryByRole("radiogroup", { name: "Run affiché" })).not.toBeInTheDocument();

    advance(30_000);

    expect(screen.getByRole("region", { name: "Toi" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "User supprimé" })).not.toBeInTheDocument();
  });

  test("a Duel played before the Score shows « — » in place of the Score and the Combo", async () => {
    const { advance } = await renderReplay(
      replayed({
        me: player("ada", adaTyped, null),
        opponent: player("alan", [], null),
      }),
    );

    advance(850);

    expect(scoreCard("Toi")).toEqual(["—", "85", "—"]);
    expect(scoreCard("@alan")).toEqual(["—", "0", "—"]);

    advance(30_000);

    const own = screen.getByRole("region", { name: "Toi" });

    expect(within(own).getByText("score").nextElementSibling).toHaveTextContent("—");
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("the header: against whom, when, what kind of Duel, its time and Language", async () => {
      await renderReplay(replayed({ outcome: "loss", forfeit: true, tp: -15 }));

      expect(
        screen.getByRole("heading", { level: 1, name: "Replay vs. @alan" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/ · 30 s · English$/)).toHaveTextContent(
        /^Sep 20, 2026, \d{1,2}:\d\d\s[AP]M · Ranked Duel · 30 s · English$/,
      );
      expect(screen.getByText("Defeat by Forfeit")).toBeInTheDocument();
      expect(screen.getByText("−15 TP")).toBeInTheDocument();
    });

    test("the Lecture card: its time bar, its seconds and its controls, named in English", async () => {
      const { user, advance } = await renderReplay(replayed());

      const lecture = within(screen.getByRole("region", { name: "Playback" }));
      const bar = lecture.getByLabelText("Replay time", { selector: "input[type=range]" });

      advance(3_050);

      expect(lecture.getByRole("timer", { name: "Playback time" })).toHaveTextContent("3.1 s");
      expect(bar).toHaveAttribute("aria-valuetext", "3.1 s of 30 s");
      expect(lecture.getByRole("radiogroup", { name: "Playback speed" })).toBeInTheDocument();
      expect(lecture.getByRole("radio", { name: "0.5×" })).toBeInTheDocument();
      expect(lecture.getByRole("radiogroup", { name: "Run shown" })).toBeInTheDocument();

      await user.click(lecture.getByRole("button", { name: "Pause" }));

      expect(lecture.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    test("the Score cards and the Runs, named after their player", async () => {
      const { user } = await renderReplay(replayed());

      expect(screen.getByRole("region", { name: "Your Score" })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "@alan's Score" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Your Run" })).toBeChecked();
      expect(screen.getByRole("region", { name: "Your Run" })).toBeInTheDocument();

      await user.click(screen.getByRole("radio", { name: "@alan's Run" }));

      expect(screen.getByRole("region", { name: "@alan's Run" })).toBeInTheDocument();
    });

    test("at the end, both Results, figures grouped the English way, and a way to watch again", async () => {
      const { advance } = await renderReplay(replayed());

      advance(30_000);

      const own = screen.getByRole("region", { name: "You" });

      expect(within(own).getByText("score").nextElementSibling).toHaveTextContent("1,234");
      expect(screen.getByRole("region", { name: "@alan" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Watch again from the start" }),
      ).toBeInTheDocument();
    });

    test("the Forfeit marker says who forfeited, and when", async () => {
      await renderReplay(forfeitedAt("loss"));

      expect(screen.getByText("You forfeited at 0.6 s")).toBeInTheDocument();
    });

    test("an opponent who forfeited, then deleted their User", async () => {
      await renderReplay(forfeitedAt("win", { opponent: null }));

      expect(
        screen.getByRole("heading", { level: 1, name: "Replay vs. Deleted User" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Deleted User forfeited at 0.6 s")).toBeInTheDocument();
    });

    test("an opponent's Forfeit", async () => {
      await renderReplay(forfeitedAt("win"));

      expect(screen.getByText("@alan forfeited at 0.6 s")).toBeInTheDocument();
    });
  });
});

// The page shown for a Duel that cannot be read, on a router of its own: its way out is a link.
const renderError = async () => {
  const router = createRouter({
    routeTree: createRootRoute({ component: ReplayErrorPage }),
    history: createMemoryHistory({ initialEntries: ["/duels/gone"] }),
  });

  await router.load();
  render(<RouterProvider router={router} />);
};

describe("ReplayErrorPage", () => {
  test("says the Duel cannot be found, and leads back to the Duel history", async () => {
    await renderError();

    expect(await screen.findByRole("heading", { name: "Duel introuvable" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retour à la Duel history" })).toHaveAttribute(
      "href",
      "/duels",
    );
  });

  test("in English", async () => {
    useLocaleStore.setState({ locale: "en" });
    await renderError();

    expect(await screen.findByRole("heading", { name: "Duel not found" })).toBeInTheDocument();
    expect(
      screen.getByText("This Duel doesn't exist, or you didn't play in it."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Duel history" })).toHaveAttribute(
      "href",
      "/duels",
    );
  });
});

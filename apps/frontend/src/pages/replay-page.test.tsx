import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import type { Keystroke } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { ReplayedDuel, ReplayedPlayer } from "@/api/duel-history";
import { DuelReplay } from "@/components/replay/duel-replay";
import { ClockContext } from "@/components/run/clock-context";

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
  me: player("ada", adaTyped, 1234),
  opponent: player("alan", [{ kind: "char", char: "s", at: 150 }], 567),
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

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ClockContext value={() => now}>
        <Suspense>
          <DuelReplay duelId={duel.id} />
        </Suspense>
      </ClockContext>
    </QueryClientProvider>,
  );

  await screen.findByRole("timer");

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

const statuses = (word: string) =>
  Array.from(screen.getByText(isWord(word)).children, (letter) =>
    letter.getAttribute("data-status"),
  );

const timer = () => screen.getByRole("timer");

// The slider hides its thumb until it has measured its track, which happy-dom never lays out: its
// name is not computed then, so it is found by its label instead.
const timeline = () => screen.getByLabelText("Temps du Replay", { selector: "input[type=range]" });

// Moves the time bar with the keyboard: Home is the start, each arrow a tenth of a second.
const seek = async (user: ReturnType<typeof userEvent.setup>, keys: string) => {
  timeline().focus();
  await user.keyboard(keys);
};

describe("DuelReplay", () => {
  test("shows against whom and how the Duel ended", async () => {
    await renderReplay(replayed({ outcome: "loss", forfeit: true }));

    const header = within(screen.getByRole("banner"));

    expect(header.getByText("@alan")).toBeInTheDocument();
    expect(header.getByText("Défaite par Forfeit")).toBeInTheDocument();
    expect(header.getByText(/20 sept\. 2026/)).toBeInTheDocument();
  });

  test("plays the Duel on at the pace of the clock, Keystroke by Keystroke", async () => {
    const { advance } = await renderReplay(replayed());

    expect(statuses("small")).toEqual(["pending", "pending", "pending", "pending", "pending"]);
    expect(timer()).toHaveTextContent("30");

    advance(250);

    expect(statuses("small")).toEqual(["correct", "correct", "pending", "pending", "pending"]);

    advance(100);

    // The wrong letter shows until the backspace that erases it.
    expect(statuses("small")).toEqual(["correct", "correct", "incorrect", "pending", "pending"]);

    advance(500);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);

    // 3.05 s in: the clock of the Duel shows the seconds left.
    advance(2_200);

    expect(timer()).toHaveTextContent("27");
  });

  test("a pause holds the Run until the Replay resumes", async () => {
    const { user, advance } = await renderReplay(replayed());

    advance(350);
    await user.click(screen.getByRole("button", { name: "Pause" }));
    advance(5_000);

    expect(statuses("small")).toEqual(["correct", "correct", "incorrect", "pending", "pending"]);
    expect(timer()).toHaveTextContent("30");

    await user.click(screen.getByRole("button", { name: "Reprendre" }));
    advance(500);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  test("at the end, both Results and Scores, then it plays again from the start", async () => {
    const { user, advance } = await renderReplay(replayed());

    advance(30_000);

    const own = screen.getByRole("region", { name: "Toi" });
    const opponent = screen.getByRole("region", { name: "@alan" });

    expect(within(own).getByText("score").nextElementSibling).toHaveTextContent("1234");
    expect(within(opponent).getByText("score").nextElementSibling).toHaveTextContent("567");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Revoir depuis le début" }));

    expect(timer()).toHaveTextContent("30");
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
    expect(screen.getByRole("button", { name: "Reprendre" })).toBeInTheDocument();
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

    expect(screen.getByRole("radio", { name: "Toi" })).toBeChecked();

    advance(300);
    await user.click(screen.getByRole("radio", { name: "@alan" }));

    expect(statuses("small")).toEqual(["correct", "incorrect", "pending", "pending", "pending"]);

    advance(400);

    expect(statuses("small")).toEqual(["correct", "pending", "pending", "pending", "pending"]);
    expect(timeline()).toHaveAttribute("aria-valuenow", "700");

    await user.click(screen.getByRole("radio", { name: "Toi" }));

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  test("once the opponent's User is deleted, only the User's side plays", async () => {
    const { advance } = await renderReplay(replayed({ opponent: null }));

    expect(within(screen.getByRole("banner")).getByText("User supprimé")).toBeInTheDocument();

    advance(850);

    expect(statuses("small")).toEqual(["correct", "correct", "correct", "correct", "correct"]);

    advance(30_000);

    expect(screen.getByRole("region", { name: "Toi" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "User supprimé" })).not.toBeInTheDocument();
  });

  test("a Duel played before the Score shows « — » in place of the Score", async () => {
    const { advance } = await renderReplay(
      replayed({
        me: player("ada", adaTyped, null),
        opponent: player("alan", [], null),
      }),
    );

    expect(screen.queryByRole("region", { name: "Score de Toi" })).not.toBeInTheDocument();

    advance(30_000);

    const own = screen.getByRole("region", { name: "Toi" });

    expect(within(own).getByText("score").nextElementSibling).toHaveTextContent("—");
  });
});

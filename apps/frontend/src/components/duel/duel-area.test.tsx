import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ServerMessage } from "api";
import { StrictMode } from "react";
import type { Keystroke } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelArea } from "@/components/duel/duel-area";
import { ClockContext } from "@/components/run/clock-context";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { fakeServer, idle } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
};

const STARTS_AT = 3000;

// Seed 42's Text: « small help while late letter sell driver quiet never learn brother again proud
// run floor pull empty large river leave under grass travel garden driver beach clock poor… ».
const duelFound: ServerMessage = {
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: STARTS_AT,
  },
  opponent: { handle: "kzr_", image: null, ornament: null },
  selfOrnament: null,
  serverTime: 0,
  pace: 50,
  opponentPace: 50,
  selfRank: { placementsLeft: 5 },
  opponentRank: { placementsLeft: 5 },
  selfForm: null,
  opponentForm: null,
  selfStake: null,
};

// The Text cut at 41 characters at most, spaces included, as on the board.
const LINES = [
  "small help while late letter sell driver",
  "quiet never learn brother again proud run",
  "floor pull empty large river leave under",
  "grass travel garden driver beach clock",
];

// The tab's clock, moved by hand.
let now = 0;

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the store outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

beforeEach(() => {
  now = 0;
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useConnectionStore.getState().open(sockets.open);
  server().receive(idle());
});

afterEach(() => {
  gsapClock.release();
  useConnectionStore.getState().close();
});

// DuelArea on the Duel of Seed 42 against @kzr_, its Countdown over: typing counts.
const renderStartedDuel = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(friendsQueryOptions.queryKey, []);

  const router = createRouter({
    routeTree: createRootRoute({ component: DuelArea }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ClockContext value={() => now}>
          <RouterProvider router={router} />
        </ClockContext>
      </QueryClientProvider>
    </StrictMode>,
  );
  receive({ type: "queued" });
  receive(duelFound);
  now = STARTS_AT;
  act(() => useDuelStore.getState().tick(now));
};

// The Text's rows as shown, each word's letters read in a row.
const rows = () =>
  Array.from(document.querySelectorAll("[data-text-row]"), (row) =>
    Array.from(row.querySelectorAll("[data-word]"), (word) => word.textContent).join(" "),
  );

// A word is split into one element per letter: match the element that holds them all.
const isWord = (word: string) => (_: string, element: Element | null) =>
  element !== null && element.hasAttribute("data-word") && element.textContent === word;

const statuses = (word: string) =>
  Array.from(screen.getByText(isWord(word)).children, (letter) =>
    letter.getAttribute("data-status"),
  );

const opponentCaret = () => document.querySelector("[data-caret=opponent]");

// The opponent validates `count` words, each typed wrong: one letter, then space.
const opponentSkips = (count: number): Keystroke[] =>
  Array.from({ length: count }, (_, i): Keystroke[] => [
    { kind: "char", char: "x", at: 100 + i * 20 },
    { kind: "char", char: " ", at: 110 + i * 20 },
  ]).flat();

// `text` typed right, a char every `step` ms from `from` ms after GO: at 250 ms or more, too slow
// for a Burst.
const typedRight = (text: string, from = 0, step = 500): Keystroke[] =>
  Array.from(text, (char, i) => ({ kind: "char", char, at: from + i * step }));

// `text` typed right at GO, as fast as can be: each word of 4 letters is a Burst.
const rushed = (text: string) => typedRight(text, 0, 0);

// The zone under the band that announces the Callouts, one at a time.
const callouts = () => screen.getByRole("status", { name: "Callouts" });

// The tab's clock moves on to `ms` after GO, and a frame goes by: the HUD reads it on each one.
const at = async (ms: number) => {
  now = STARTS_AT + ms;
  await act(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      }),
  );
};

// The band, named after who leads.
const band = () => screen.getByRole("region", { name: /mène|Même Score/ });

// One half of the band: this User's, or the opponent's.
const half = (player: string) => screen.getByRole("region", { name: player });

const pipsLit = (player: string) =>
  within(half(player)).getByRole("meter", { name: "Combo" }).getAttribute("value");

// The red a broken Combo turns a player's gauge, null when it is not.
const brokenGauge = (player: string) => half(player).querySelector("[data-combo-broken]");

// The server's state of the Duel once the connection is back, the opponent's Keystrokes in it, and
// this User's it received.
const duelResumed = (
  opponentKeystrokes: Keystroke[],
  keystrokes: Keystroke[] = [],
): ServerMessage => ({
  type: "duel-resumed",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: STARTS_AT,
  },
  opponent: { handle: "kzr_", image: null, ornament: null },
  selfOrnament: null,
  serverTime: now,
  keystrokes,
  received: keystrokes.length,
  opponentKeystrokes,
  opponentConnected: true,
  pace: 50,
  opponentPace: 50,
  selfRank: { placementsLeft: 5 },
  opponentRank: { placementsLeft: 5 },
  selfForm: null,
  opponentForm: null,
  selfStake: null,
});

// The connection drops, then opens again a second later.
const reconnect = () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  act(() => server().drop());
  act(() => vi.advanceTimersByTime(1000));
  vi.useRealTimers();
};

describe("the band and the disc", () => {
  test("names who leads the Duel, and by how much", async () => {
    await renderStartedDuel();

    expect(band()).toHaveAccessibleName("Même Score");

    // Six seconds in: slow enough for no Burst.
    now = STARTS_AT + 6000;
    await userEvent.keyboard("small ");

    expect(band()).toHaveAccessibleName("Tu mènes de 6 points");

    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small help ") });

    expect(band()).toHaveAccessibleName("@kzr_ mène de 5 points");
  });

  test("shows the seconds left, and the Lead under them", async () => {
    await renderStartedDuel();

    const timer = screen.getByRole("timer", { name: "temps restant" });

    expect(timer).toHaveTextContent("30");
    expect(within(band()).getByText("=")).toBeInTheDocument();

    now = STARTS_AT + 12_500;
    act(() => useDuelStore.getState().tick(now));

    await waitFor(() => expect(timer).toHaveTextContent("18"));

    await userEvent.keyboard("small ");
    // Once the word's « +6 » is gone, the only one left is the Lead's.
    now += 1000;

    await waitFor(() => expect(within(band()).getByText("+6")).toBeInTheDocument());

    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small help ") });
    now += 1000;

    await waitFor(() => expect(within(band()).getByText("+5")).toBeInTheDocument());
  });

  test("shows each side's multiplier and the pips its Combo lit", async () => {
    await renderStartedDuel();

    expect(half("Toi")).toHaveTextContent("multiplicateur ×1");
    expect(pipsLit("Toi")).toBe("0");
    expect(half("@kzr_")).toHaveTextContent("multiplicateur ×1");
    expect(pipsLit("@kzr_")).toBe("0");

    await userEvent.keyboard("small help while late ");
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small help ") });

    expect(half("Toi")).toHaveTextContent("multiplicateur ×2");
    expect(pipsLit("Toi")).toBe("4");
    expect(half("@kzr_")).toHaveTextContent("multiplicateur ×1");
    expect(pipsLit("@kzr_")).toBe("2");
  });
});

describe("the effects of each side's words", () => {
  test("each right word's points rise by its player's Score, then go", async () => {
    await renderStartedDuel();

    now = STARTS_AT + 6000;
    await userEvent.keyboard("small ");
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small help ") });
    now += 200;

    await waitFor(() => expect(within(half("Toi")).getByText("+6")).toBeVisible());
    expect(within(half("@kzr_")).getByText("+5")).toBeVisible();

    now += 1000;

    await waitFor(() => expect(within(half("Toi")).queryByText("+6")).toBeNull());
    expect(within(half("@kzr_")).queryByText("+5")).toBeNull();
  });

  test("the opponent's broken Combo turns their gauge red, which fades", async () => {
    await renderStartedDuel();

    now = STARTS_AT + 6000;
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small x") });
    now += 100;

    await waitFor(() => expect(brokenGauge("@kzr_")).toBeVisible());
    expect(brokenGauge("Toi")).toBeNull();

    now += 800;

    await waitFor(() => expect(brokenGauge("@kzr_")).toBeNull());
  });

  test("the Keystrokes a resync or a resume replays show no effect", async () => {
    await renderStartedDuel();

    now = STARTS_AT + 6000;
    receive({
      type: "resync",
      keystrokes: [],
      received: 0,
      opponentKeystrokes: typedRight("small x"),
    });

    expect(half("@kzr_")).toHaveTextContent("Score 6");
    expect(within(half("@kzr_")).queryByText("+6")).toBeNull();
    expect(brokenGauge("@kzr_")).toBeNull();
    expect(callouts()).toBeEmptyDOMElement();

    reconnect();
    receive({ type: "elsewhere", place: "duel" });
    receive(duelResumed(rushed("small ")));
    await at(6100);

    expect(half("@kzr_")).toHaveTextContent("Score 12");
    expect(within(half("@kzr_")).queryByText("+12")).toBeNull();
    expect(callouts()).toBeEmptyDOMElement();
  });
});

describe("the Callouts", () => {
  test("this User's Burst, with its points", async () => {
    await renderStartedDuel();

    // At GO, as fast as can be: a Burst, paid twice.
    await userEvent.keyboard("small ");
    await at(100);

    expect(callouts()).toHaveTextContent("BURST +12");
  });

  test("comes in on the frame of its Keystroke, not on the HUD's next tenth of a second", async () => {
    await renderStartedDuel();

    // Fast enough for a Burst, between two tenths of a second.
    now = STARTS_AT + 1034;
    await userEvent.keyboard("small ");
    await at(1050);

    expect(callouts()).toHaveTextContent("BURST +12");

    await at(5000);
    receive({ type: "opponent-keystrokes", keystrokes: rushed("small ") });
    await at(5016);

    expect(callouts()).toHaveTextContent("BURST @kzr_ +12");
  });

  test("a Lead change comes in on the frame its lead has held 300 ms", async () => {
    await renderStartedDuel();

    await at(3000);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small ") });
    await at(4000);
    await userEvent.keyboard("small ");
    now = STARTS_AT + 7050;
    await userEvent.keyboard("help ");
    await at(7340);

    expect(callouts()).toBeEmptyDOMElement();

    await at(7360);

    expect(callouts()).toHaveTextContent("TU PASSES DEVANT");
  });

  test("this User's Combo going up a step", async () => {
    await renderStartedDuel();

    // A word every 3 s: too slow for a Burst.
    await at(3000);
    await userEvent.keyboard("small ");
    await at(6000);
    await userEvent.keyboard("help ");
    await at(9000);
    await userEvent.keyboard("while ");
    await at(12_000);

    expect(callouts()).toBeEmptyDOMElement();

    await userEvent.keyboard("late ");
    await at(12_100);

    expect(callouts()).toHaveTextContent("COMBO ×2");
  });

  test("this User's broken Combo, with the words it lost", async () => {
    await renderStartedDuel();

    await at(3000);
    await userEvent.keyboard("small ");
    await at(6000);
    await userEvent.keyboard("help ");
    await at(9000);
    await userEvent.keyboard("while x");
    await at(9100);

    expect(callouts()).toHaveTextContent("COMBO CASSÉ 3 mots");
  });

  test("the opponent's Bursts and broken Combos, by their Handle", async () => {
    await renderStartedDuel();

    await at(1000);
    receive({ type: "opponent-keystrokes", keystrokes: rushed("small ") });
    await at(1100);

    expect(callouts()).toHaveTextContent("BURST @kzr_ +12");

    await at(3000);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("help x", 3000) });
    await at(3100);

    expect(callouts()).toHaveTextContent("COMBO CASSÉ @kzr_");
  });

  test("the opponent's ×4, never their ×2 nor their ×3", async () => {
    await renderStartedDuel();

    await at(1000);
    receive({
      type: "opponent-keystrokes",
      keystrokes: typedRight("small help while late ", 0, 250),
    });
    await at(1100);

    expect(half("@kzr_")).toHaveTextContent("multiplicateur ×2");
    expect(callouts()).toBeEmptyDOMElement();

    await at(2000);
    receive({
      type: "opponent-keystrokes",
      keystrokes: typedRight("letter sell driver quiet never ", 5500, 250),
    });
    await at(2100);

    expect(half("@kzr_")).toHaveTextContent("multiplicateur ×3");
    expect(callouts()).toBeEmptyDOMElement();

    await at(3000);
    receive({
      type: "opponent-keystrokes",
      keystrokes: typedRight("learn brother again proud run ", 13_250, 250),
    });
    await at(3100);

    expect(half("@kzr_")).toHaveTextContent("multiplicateur ×4");
    expect(callouts()).toHaveTextContent("COMBO @kzr_ ×4");
  });

  test("a Lead change once the new lead has held 300 ms, never the first lead", async () => {
    await renderStartedDuel();

    // The opponent leads first: no Lead change.
    await at(3000);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small ") });
    await at(3500);

    expect(callouts()).toBeEmptyDOMElement();

    await at(4000);
    await userEvent.keyboard("small ");
    await at(7000);
    await userEvent.keyboard("help ");
    await at(7200);

    expect(band()).toHaveAccessibleName("Tu mènes de 5 points");
    expect(callouts()).toBeEmptyDOMElement();

    await at(7300);

    expect(callouts()).toHaveTextContent("TU PASSES DEVANT");

    // It lasts 1.4 s.
    await at(8600);

    expect(callouts()).toHaveTextContent("TU PASSES DEVANT");

    await at(8700);

    expect(callouts()).toBeEmptyDOMElement();

    await at(9000);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("help while ", 3000) });
    await at(9300);

    expect(callouts()).toHaveTextContent("@kzr_ PASSE DEVANT");
  });

  test("a lead held 100 ms is no Lead change", async () => {
    await renderStartedDuel();

    await at(3000);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("small ") });
    await at(4000);
    await userEvent.keyboard("small ");
    await at(7000);
    await userEvent.keyboard("help ");
    await at(7100);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("help while ", 3000) });

    expect(band()).toHaveAccessibleName("@kzr_ mène de 6 points");

    await at(7400);

    expect(callouts()).toBeEmptyDOMElement();

    await at(7500);

    expect(callouts()).toBeEmptyDOMElement();
  });

  test("after a resume, the lead the Duel is resumed on is no first lead", async () => {
    await renderStartedDuel();

    // A reload: this User's Keystrokes come back from the server, none heard in this tab.
    await at(6000);
    reconnect();
    receive({ type: "elsewhere", place: "duel" });
    receive(duelResumed(typedRight("small "), typedRight("small help ")));

    expect(band()).toHaveAccessibleName("Tu mènes de 5 points");

    await at(7000);
    receive({ type: "opponent-keystrokes", keystrokes: typedRight("help while ", 3000) });
    await at(7300);

    expect(callouts()).toHaveTextContent("@kzr_ PASSE DEVANT");
  });

  test("a Callout stays 500 ms before one as important takes its place, a more important one at once", async () => {
    await renderStartedDuel();

    receive({ type: "opponent-keystrokes", keystrokes: rushed("small ") });
    await at(0);

    expect(callouts()).toHaveTextContent("BURST @kzr_ +12");

    // This User's Burst goes before the opponent's.
    await at(100);
    await userEvent.keyboard("small ");
    await at(150);

    expect(callouts()).toHaveTextContent("BURST +12");
    expect(callouts()).not.toHaveTextContent("@kzr_");

    // Another Burst of this User's 200 ms later: the first one stays.
    await at(300);
    await userEvent.keyboard("help ");
    await at(400);

    expect(callouts()).toHaveTextContent("BURST +12");

    // Their lead held 300 ms: a Lead change goes before a Burst.
    await at(600);

    expect(callouts()).toHaveTextContent("TU PASSES DEVANT");
  });

  test("once 500 ms went by, a Callout as important takes the place", async () => {
    await renderStartedDuel();

    await userEvent.keyboard("small ");
    await at(300);
    await userEvent.keyboard("help ");
    await at(400);

    expect(callouts()).toHaveTextContent("BURST +12");

    await at(700);
    await userEvent.keyboard("x");
    await at(800);

    expect(callouts()).toHaveTextContent("COMBO CASSÉ 2 mots");
  });

  test("lasts 1.1 s from its reception, even the opponent's received late", async () => {
    await renderStartedDuel();

    // Typed at GO, received 6 s later.
    await at(6000);
    receive({ type: "opponent-keystrokes", keystrokes: rushed("small ") });
    await at(7000);

    expect(callouts()).toHaveTextContent("BURST @kzr_ +12");

    await at(7100);

    expect(callouts()).toBeEmptyDOMElement();
  });

  test("a lost connection goes before any Callout while it lasts", async () => {
    await renderStartedDuel();

    receive({ type: "opponent-keystrokes", keystrokes: rushed("small ") });
    await at(100);

    expect(callouts()).toHaveTextContent("BURST @kzr_ +12");

    receive({ type: "opponent-disconnected" });

    expect(callouts()).toHaveTextContent(
      "Connexion de @kzr_ perdue : Forfeit sans retour sous 10 s.",
    );
    expect(callouts()).not.toHaveTextContent("BURST");

    receive({ type: "opponent-reconnected" });

    expect(callouts()).toHaveTextContent("BURST @kzr_ +12");

    act(() => server().drop());

    expect(callouts()).toHaveTextContent("Connexion perdue, reconnexion…");
    expect(callouts()).not.toHaveTextContent("BURST");
  });
});

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

// The server ends the Duel: `outcome` for this User, on the Scores it computed.
const duelEnded = ({
  outcome,
  score,
  opponentScore,
  forfeit = false,
}: {
  outcome: "win" | "loss" | "draw";
  score: number;
  opponentScore: number;
  forfeit?: boolean;
}): ServerMessage => ({
  type: "duel-ended",
  duelId: null,
  ranked: null,
  outcome,
  forfeit,
  result: noResult,
  opponentResult: noResult,
  score: { score, bestCombo: 0, bursts: 0 },
  opponentScore: { score: opponentScore, bestCombo: 0, bursts: 0 },
  opponent: { handle: "kzr_", image: null },
});

const endScreen = () => screen.queryByRole("button", { name: "Nouveau Duel" });

describe("the end of the Duel", () => {
  test("the disc says FIN once the time is up", async () => {
    await renderStartedDuel();

    const timer = screen.getByRole("timer", { name: "temps restant" });

    await at(29_900);

    expect(timer).toHaveTextContent("1");

    await at(30_000);

    expect(timer).toHaveTextContent("FIN");
  });

  test("tells the server's outcome, a win on accuracy at equal Scores too", async () => {
    await renderStartedDuel();

    await at(30_000);

    expect(callouts()).toBeEmptyDOMElement();

    receive(duelEnded({ outcome: "win", score: 0, opponentScore: 0 }));

    // No gap to tell.
    expect(callouts().textContent?.trim()).toBe("VICTOIRE");
  });

  test("holds the HUD 2 s after the time is up, then gives way to the end screen", async () => {
    await renderStartedDuel();

    await at(30_000);
    receive(duelEnded({ outcome: "win", score: 6, opponentScore: 0 }));
    await at(31_900);

    expect(endScreen()).toBeNull();
    expect(callouts()).toHaveTextContent("VICTOIRE +6");

    await at(32_000);

    expect(endScreen()).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Callouts" })).toBeNull();
  });

  test("an outcome told after the 2 s gives way to the end screen at once", async () => {
    await renderStartedDuel();

    await at(33_000);

    expect(endScreen()).toBeNull();

    receive(duelEnded({ outcome: "loss", score: 0, opponentScore: 6 }));
    await at(33_000);

    expect(endScreen()).toBeInTheDocument();
  });

  test("a connection lost during the hold still ends on the end screen", async () => {
    await renderStartedDuel();

    await at(30_000);
    receive(duelEnded({ outcome: "win", score: 6, opponentScore: 0 }));
    await at(30_500);
    reconnect();
    // The Duel over, the User has no place anymore.
    receive(idle());
    await at(32_000);

    expect(endScreen()).toBeInTheDocument();
  });

  test("a Forfeit during the Duel goes to the end screen at once", async () => {
    await renderStartedDuel();

    await at(10_000);
    receive(duelEnded({ outcome: "win", score: 0, opponentScore: 0, forfeit: true }));

    expect(endScreen()).toBeInTheDocument();
  });

  test("a Forfeit once the time is up still holds the HUD 2 s", async () => {
    await renderStartedDuel();

    // The opponent's time to come back runs out after the end.
    await at(30_000);
    receive(duelEnded({ outcome: "win", score: 6, opponentScore: 0, forfeit: true }));
    await at(31_900);

    expect(endScreen()).toBeNull();
    expect(callouts()).toHaveTextContent("VICTOIRE +6");

    await at(32_000);

    expect(endScreen()).toBeInTheDocument();
  });

  test("greys the loser's half to 50 % over 300 ms", async () => {
    await renderStartedDuel();

    await at(30_000);
    receive(duelEnded({ outcome: "loss", score: 10, opponentScore: 12 }));
    gsapClock.advance(0.15);

    // Halfway there.
    expect(Number(half("Toi").style.opacity)).toBeGreaterThan(0.5);
    expect(Number(half("Toi").style.opacity)).toBeLessThan(1);

    gsapClock.advance(0.15);

    expect(half("Toi")).toHaveStyle({ opacity: "0.5" });
    expect(half("@kzr_")).not.toHaveStyle({ opacity: "0.5" });
  });

  test("greys neither half on a draw", async () => {
    await renderStartedDuel();

    await at(30_000);
    receive(duelEnded({ outcome: "draw", score: 12, opponentScore: 12 }));
    gsapClock.advance(0.3);

    expect(half("Toi")).not.toHaveStyle({ opacity: "0.5" });
    expect(half("@kzr_")).not.toHaveStyle({ opacity: "0.5" });
  });

  test.each([
    { outcome: "win", score: 31, opponentScore: 24, said: "VICTOIRE +7" },
    { outcome: "loss", score: 12, opponentScore: 20, said: "DÉFAITE −8" },
    { outcome: "draw", score: 15, opponentScore: 15, said: "DRAW" },
  ] as const)(
    "tells a $outcome by the gap in the server's Scores, never in the HUD's",
    async ({ outcome, score, opponentScore, said }) => {
      await renderStartedDuel();

      await at(30_000);
      receive(duelEnded({ outcome, score, opponentScore }));

      expect(callouts()).toHaveTextContent(said);
    },
  );
});

describe("the Duel's Text", () => {
  test("shows three rows, the caret's staying the second once past the first", async () => {
    await renderStartedDuel();

    expect(rows()).toEqual(LINES.slice(0, 3));

    await userEvent.keyboard(`${LINES[0]} `);

    expect(rows()).toEqual(LINES.slice(0, 3));

    await userEvent.keyboard(`${LINES[1]} `);

    expect(rows()).toEqual(LINES.slice(1, 4));
  });

  test("shows each letter's state, extra and skipped ones included", async () => {
    await renderStartedDuel();

    await userEvent.keyboard("smallxy he wx");

    expect(statuses("smallxy")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
      "extra",
      "extra",
    ]);
    expect(statuses("help")).toEqual(["correct", "correct", "missed", "missed"]);
    expect(statuses("while")).toEqual(["correct", "incorrect", "pending", "pending", "pending"]);
  });

  test("shows the opponent's caret with their initials, never past the three rows", async () => {
    await renderStartedDuel();

    expect(opponentCaret()).toHaveTextContent("KZ");
    expect(opponentCaret()).toBeVisible();

    // Past the 21 words of the first three rows.
    receive({ type: "opponent-keystrokes", keystrokes: opponentSkips(21) });

    expect(opponentCaret()).not.toBeVisible();

    // Once this User is on the next row, the opponent's is shown again.
    await userEvent.keyboard(`${LINES[0]} ${LINES[1]} `);

    expect(opponentCaret()).toBeVisible();
  });
});

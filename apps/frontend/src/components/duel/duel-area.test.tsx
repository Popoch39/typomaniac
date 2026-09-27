import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ServerMessage } from "api";
import { StrictMode } from "react";
import type { Keystroke } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelArea } from "@/components/duel/duel-area";
import { ClockContext } from "@/components/run/clock-context";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { fakeServer } from "@/test/fake-socket";
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
  server().receive({ type: "idle" });
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

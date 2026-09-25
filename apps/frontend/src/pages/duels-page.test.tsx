import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  type DuelHistoryPage,
  duelHistoryQueryOptions,
  type ReplayedDuel,
  type ReplayedPlayer,
  replayedDuelQueryOptions,
} from "@/api/duel-history";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelsPage } from "@/pages/duels-page";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
};

type Entry = DuelHistoryPage["duels"][number];

const entry = (overrides: Partial<Entry>): Entry => ({
  id: "duel-1",
  endedAt: Date.UTC(2026, 8, 20, 18, 30),
  opponent: { handle: "alan", image: null },
  outcome: "win",
  forfeit: false,
  score: 1200,
  opponentScore: 800,
  wpm: 90,
  opponentWpm: 70,
  tp: null,
  ...overrides,
});

const player = (handle: string, score: number, pace: number | null): ReplayedPlayer => ({
  handle,
  image: null,
  result: {
    wpm: 42,
    raw: 45,
    accuracy: 96,
    consistency: 80,
    chars: { correct: 21, incorrect: 1, extra: 0, missed: 0 },
  },
  pace,
  score: pace === null ? null : { score, bestCombo: 3, bursts: 0 },
  // Seed 42 in English, version 1, starts with "small".
  keystrokes: [
    { kind: "char", char: "s", at: 100 },
    { kind: "char", char: "x", at: 1_200 },
  ],
});

// The whole Duel, as its Replay and its details read it.
const replayed = (overrides: Partial<ReplayedDuel>): ReplayedDuel => ({
  id: "duel-1",
  seed: 42,
  language: "en",
  wordListVersion: 1,
  seconds: 30,
  startsAt: Date.UTC(2026, 8, 20, 18, 29, 30),
  endedAt: Date.UTC(2026, 8, 20, 18, 30),
  outcome: "win",
  forfeit: false,
  me: player("ada", 1234, 50),
  opponent: player("alan", 567, 50),
  ...overrides,
});

// Stands for the browser seeing the sentinel at the bottom of the list as soon as it is observed.
class VisibleAtOnce {
  readonly #callback: (entries: { isIntersecting: boolean }[]) => void;

  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    this.#callback = callback;
  }

  observe() {
    this.#callback([{ isIntersecting: true }]);
  }

  disconnect() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// The page with its first page of Duels in the cache, the way the route's loader leaves it, on a
// router of its own: its rows are links.
const renderPage = async (first: DuelHistoryPage, details: ReplayedDuel[] = []) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);

  for (const duel of details) {
    queryClient.setQueryData(replayedDuelQueryOptions(duel.id).queryKey, duel);
  }

  queryClient.setQueryData(duelHistoryQueryOptions.queryKey, {
    pages: [first],
    pageParams: [null],
  });

  const router = createRouter({
    routeTree: createRootRoute({ component: DuelsPage }),
    history: createMemoryHistory({ initialEntries: ["/duels"] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Duels" });
};

const rows = () =>
  within(screen.getByRole("list", { name: "Duel history" })).getAllByRole("listitem");

const row = (index: number) => {
  const found = rows()[index];

  if (found === undefined) {
    throw new Error(`No Duel at row ${index}`);
  }

  return found;
};

// The row itself, which opens and closes the Duel's details.
const toggle = (index: number) =>
  within(row(index)).getByRole("button", { name: /@|User supprimé/ });

// « Revoir », in the details of an open Duel: a link styled as a button.
const replayLink = (index: number) => within(row(index)).queryByRole("button", { name: "Revoir" });

describe("DuelsPage", () => {
  test("lists each Duel from the User's side: opponent, outcome, Scores and wpm", async () => {
    await renderPage({
      duels: [
        entry({ id: "won" }),
        entry({
          id: "forfeited",
          outcome: "loss",
          forfeit: true,
          opponent: { handle: "grace", image: null },
        }),
        entry({ id: "drawn", outcome: "draw", score: null, opponentScore: null }),
        entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null }),
      ],
      next: null,
    });

    const [won, forfeited, drawn, deleted] = rows();

    expect(won).toHaveTextContent("@alan");
    expect(won).toHaveTextContent("Victoire");
    expect(won).toHaveTextContent("1200 – 800");
    expect(won).toHaveTextContent("90 – 70 wpm");

    expect(forfeited).toHaveTextContent("@grace");
    expect(forfeited).toHaveTextContent("Défaite par Forfeit");

    // Played before the Score.
    expect(drawn).toHaveTextContent("Draw");
    expect(drawn).toHaveTextContent("— – —");

    expect(deleted).toHaveTextContent("User supprimé");
    expect(deleted).toHaveTextContent("1200 – —");
    expect(deleted).toHaveTextContent("90 – — wpm");
  });

  test("the opponent's Handle leads to their Profile without opening the Duel", async () => {
    await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

    const link = within(row(0)).getByRole("link", { name: "@alan" });

    expect(link).toHaveAttribute("href", "/u/alan");

    await userEvent.click(link);

    expect(toggle(0)).toHaveAttribute("aria-expanded", "false");
  });

  test("a deleted opponent stays « User supprimé », with no link", async () => {
    await renderPage(
      {
        duels: [entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null })],
        next: null,
      },
      [replayed({ id: "deleted", opponent: null })],
    );

    await userEvent.click(toggle(0));

    expect(row(0)).toHaveTextContent("User supprimé");
    expect(within(row(0)).queryByRole("link", { name: /User supprimé/ })).not.toBeInTheDocument();
    expect(within(row(0)).queryAllByRole("link", { name: /^@/ })).toHaveLength(0);
  });

  test("the Duel chart names the opponent by a link to their Profile", async () => {
    await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

    await userEvent.click(toggle(0));

    const chart = within(row(0)).getByRole("figure", { name: "Duel chart" });

    expect(within(chart).getByRole("link", { name: "@alan" })).toHaveAttribute("href", "/u/alan");
  });

  test("a click opens the Duel in place: its detailed Results and the way to its Replay", async () => {
    await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

    expect(replayLink(0)).not.toBeInTheDocument();

    await userEvent.click(toggle(0));

    expect(toggle(0)).toHaveAttribute("aria-expanded", "true");
    expect(within(row(0)).getByRole("region", { name: "Toi" })).toHaveTextContent("1234");
    expect(within(row(0)).getByRole("region", { name: "@alan" })).toHaveTextContent("567");
    expect(replayLink(0)).toHaveAttribute("href", "/duels/won");
  });

  test("shows a loading state while the Duel loads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => {})),
    );

    await renderPage({ duels: [entry({ id: "won" })], next: null });

    await userEvent.click(toggle(0));

    expect(within(row(0)).getByRole("status", { name: "Chargement du Duel" })).toBeInTheDocument();
  });

  test("one Duel open at a time, a second click closes it", async () => {
    await renderPage({ duels: [entry({ id: "won" }), entry({ id: "lost" })], next: null }, [
      replayed({ id: "won" }),
      replayed({ id: "lost" }),
    ]);

    await userEvent.click(toggle(0));
    await userEvent.click(toggle(1));

    expect(toggle(0)).toHaveAttribute("aria-expanded", "false");
    expect(replayLink(0)).not.toBeInTheDocument();
    expect(replayLink(1)).toHaveAttribute("href", "/duels/lost");

    await userEvent.click(toggle(1));

    expect(replayLink(1)).not.toBeInTheDocument();
  });

  test("a deleted opponent: the User's Results only, still marked deleted", async () => {
    await renderPage(
      {
        duels: [entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null })],
        next: null,
      },
      [replayed({ id: "deleted", opponent: null })],
    );

    await userEvent.click(toggle(0));

    expect(row(0)).toHaveTextContent("User supprimé");
    expect(
      within(row(0))
        .getAllByRole("region")
        .map((region) => region.getAttribute("aria-label")),
    ).toEqual(["Toi"]);
  });

  test("a Duel before the Score shows its Scores as dashes", async () => {
    await renderPage(
      { duels: [entry({ id: "old", score: null, opponentScore: null })], next: null },
      [
        replayed({
          id: "old",
          me: player("ada", 1234, null),
          opponent: player("alan", 567, null),
        }),
      ],
    );

    await userEvent.click(toggle(0));

    expect(within(row(0)).getByRole("region", { name: "Toi" })).toHaveTextContent("score—");
  });

  test("a ranked Duel shows the TP it moved, a Challenge or an older Duel none", async () => {
    await renderPage({
      duels: [
        entry({ id: "won", tp: 18 }),
        entry({ id: "lost", outcome: "loss", tp: -15 }),
        entry({ id: "challenge" }),
      ],
      next: null,
    });

    expect(row(0)).toHaveTextContent("+18 TP");
    expect(row(1)).toHaveTextContent("−15 TP");
    expect(row(2)).not.toHaveTextContent("TP");
  });

  test("says the Duel history fills up by playing when there is none yet", async () => {
    await renderPage({ duels: [], next: null });

    expect(screen.queryByRole("list", { name: "Duel history" })).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun Duel pour l'instant/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lancer un Duel" })).toHaveAttribute("href", "/");
  });

  test("loads the next page once the bottom of the list shows", async () => {
    const fetch = vi.fn(
      async (_input: RequestInfo | URL) =>
        new Response(
          JSON.stringify({
            duels: [entry({ id: "older", opponent: { handle: "linus", image: null } })],
            next: null,
          }),
          { headers: { "content-type": "application/json" } },
        ),
    );

    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("IntersectionObserver", VisibleAtOnce);

    await renderPage({ duels: [entry({ id: "recent" })], next: "1000:recent" });

    expect(await screen.findByText("@linus")).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
    expect(String(fetch.mock.calls[0]?.[0])).toContain("before=1000%3Arecent");
  });
});

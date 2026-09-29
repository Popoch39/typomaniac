import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  type DuelHistoryPage,
  duelHistoryQueryOptions,
  type ReplayedDuel,
  type ReplayedPlayer,
  replayedDuelQueryOptions,
} from "@/api/duel-history";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelsPage } from "@/pages/duels-page";
import { Route as DuelsRoute } from "@/routes/duels";
import { useLocaleStore } from "@/stores/locale-store";

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
  ranked: false,
  ...overrides,
});

const player = (
  handle: string,
  { score, wpm, pace }: { score: number; wpm: number; pace: number | null },
): ReplayedPlayer => ({
  handle,
  image: null,
  result: {
    wpm,
    raw: wpm + 3.4,
    accuracy: 96.2,
    consistency: 80.4,
    chars: { correct: 21, incorrect: 1, extra: 0, missed: 0 },
  },
  pace,
  score: pace === null ? null : { score, bestCombo: wpm / 2, bursts: wpm / 20 },
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
  ranked: false,
  tp: null,
  me: player("ada", { score: 1234, wpm: 42, pace: 50 }),
  opponent: player("alan", { score: 567, wpm: 60, pace: 50 }),
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

// The page with its first page of Duels in the cache, the way the route's loader leaves it, on
// `/duels` of a router of its own, at `url`: its search says which Duel is chosen.
const renderPage = async (first: DuelHistoryPage, details: ReplayedDuel[] = [], url = "/duels") => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  queryClient.setQueryData(meQueryOptions.queryKey, me);

  for (const duel of details) {
    queryClient.setQueryData(replayedDuelQueryOptions(duel.id).queryKey, duel);
  }

  queryClient.setQueryData(duelHistoryQueryOptions.queryKey, {
    pages: [first],
    pageParams: [null],
  });

  const rootRoute = createRootRoute();

  const duelsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/duels",
    // The route's own schema: the page reads the search the way `/duels` validates it.
    validateSearch: DuelsRoute.options.validateSearch,
    component: DuelsPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([duelsRoute]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Duels", level: 1 });

  return router;
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

// The row's button, which chooses its Duel.
const choice = (index: number) =>
  within(row(index)).getByRole("button", { name: /@|User supprimé/ });

// The chosen Duel's details, beside the list, named by how it ended.
const details = () => screen.getByRole("region", { name: /Victoire|Défaite|Draw/ });

const table = () => within(details()).getByRole("table", { name: "Results du Duel" });

// A line of the Results table: what it measures, then the User's value and the opponent's.
const tableLine = (name: string) => {
  const line = within(table()).getByRole("rowheader", { name }).closest("tr");

  if (line === null) {
    throw new Error(`No line ${name}`);
  }

  return within(line)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
};

// The same, in English.
const englishDetails = () => screen.getByRole("region", { name: /Victory|Defeat|Draw/ });

const englishTable = () => within(englishDetails()).getByRole("table", { name: "Duel Results" });

const englishLine = (name: string) => {
  const line = within(englishTable()).getByRole("rowheader", { name }).closest("tr");

  if (line === null) {
    throw new Error(`No line ${name}`);
  }

  return within(line)
    .getAllByRole("cell")
    .map((cell) => cell.textContent);
};

describe("DuelsPage", () => {
  test("lists each Duel from the User's side, without wpm: opponent, date, Scores, outcome and TP", async () => {
    await renderPage({
      duels: [
        entry({ id: "won", ranked: true, tp: 18 }),
        entry({
          id: "forfeited",
          outcome: "loss",
          forfeit: true,
          ranked: true,
          tp: -15,
          score: 1284,
          opponent: { handle: "grace", image: null },
        }),
        entry({ id: "challenge" }),
        entry({ id: "placement", ranked: true }),
        entry({ id: "drawn", outcome: "draw", score: null, opponentScore: null }),
        entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null }),
      ],
      next: null,
    });

    const [won, forfeited, challenge, placement, drawn, deleted] = rows();

    expect(won).toHaveTextContent("@alan");
    expect(won).toHaveTextContent("20 sept. 2026");
    expect(won).toHaveTextContent("1 200800");
    expect(won).toHaveTextContent("Victoire+18 TP");
    expect(won).not.toHaveTextContent("wpm");
    expect(won).not.toHaveTextContent("Forfeit");

    expect(forfeited).toHaveTextContent("@grace");
    expect(forfeited).toHaveTextContent("· Forfeit");
    expect(forfeited).toHaveTextContent("1 284");
    expect(forfeited).toHaveTextContent("Défaite−15 TP");

    expect(challenge).toHaveTextContent("VictoireChallenge");

    // Ranked, but in Placement: no TP moved, and not a Challenge.
    expect(placement).not.toHaveTextContent("TP");
    expect(placement).not.toHaveTextContent("Challenge");

    // Played before the Score.
    expect(drawn).toHaveTextContent("——");
    expect(drawn).toHaveTextContent("Draw");

    expect(deleted).toHaveTextContent("User supprimé");
    expect(deleted).toHaveTextContent("1 200—");
  });

  test("chooses the most recent Duel on arrival", async () => {
    await renderPage(
      { duels: [entry({ id: "won" }), entry({ id: "lost", outcome: "loss" })], next: null },
      [replayed({ id: "won" })],
    );

    expect(choice(0)).toHaveAttribute("aria-pressed", "true");
    expect(choice(1)).toHaveAttribute("aria-pressed", "false");
    expect(within(details()).getByRole("heading", { level: 2 })).toHaveTextContent("Victoire");
  });

  test("the URL says which Duel is chosen", async () => {
    await renderPage(
      { duels: [entry({ id: "won" }), entry({ id: "lost", outcome: "loss" })], next: null },
      [replayed({ id: "lost", outcome: "loss" })],
      "/duels?duel=lost",
    );

    expect(choice(0)).toHaveAttribute("aria-pressed", "false");
    expect(choice(1)).toHaveAttribute("aria-pressed", "true");
    expect(within(details()).getByRole("heading", { level: 2 })).toHaveTextContent("Défaite");
  });

  test("a Duel of the URL that is not in the list falls back to the most recent", async () => {
    await renderPage(
      { duels: [entry({ id: "won" })], next: null },
      [replayed({ id: "won" })],
      "/duels?duel=gone",
    );

    expect(choice(0)).toHaveAttribute("aria-pressed", "true");
  });

  test("choosing another Duel shows it beside the list and puts it in the URL", async () => {
    const router = await renderPage(
      { duels: [entry({ id: "won" }), entry({ id: "lost", outcome: "loss" })], next: null },
      [replayed({ id: "won" }), replayed({ id: "lost", outcome: "loss" })],
    );

    await userEvent.click(choice(1));

    expect(choice(0)).toHaveAttribute("aria-pressed", "false");
    expect(choice(1)).toHaveAttribute("aria-pressed", "true");
    expect(router.state.location.search).toEqual({ duel: "lost" });
    expect(within(details()).getByRole("heading", { level: 2 })).toHaveTextContent("Défaite");
    // A link styled as a button.
    expect(within(details()).getByRole("button", { name: "Revoir le Replay" })).toHaveAttribute(
      "href",
      "/duels/lost",
    );
  });

  test("the opponent's Handle leads to their Profile, never from inside the row's button", async () => {
    await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

    const link = within(row(0)).getByRole("link", { name: "@alan" });

    expect(link).toHaveAttribute("href", "/u/alan");
    expect(link.closest("button")).toBeNull();
  });

  test("the details say how the Duel ended, against whom, when, what kind of Duel and its TP", async () => {
    await renderPage({ duels: [entry({ id: "won", ranked: true, tp: 18 })], next: null }, [
      replayed({ id: "won" }),
    ]);

    expect(details()).toHaveTextContent("contre @alan · 20 sept. 2026");
    expect(details()).toHaveTextContent("· Duel classé");
    expect(details()).toHaveTextContent("+18 TP");
    // In the header, then in the Duel chart's legend.
    expect(
      within(details())
        .getAllByRole("link", { name: "@alan" })
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/u/alan", "/u/alan"]);
  });

  test("a Challenge says so in its details, with no TP", async () => {
    await renderPage(
      { duels: [entry({ id: "won", outcome: "loss", forfeit: true })], next: null },
      [replayed({ id: "won" })],
    );

    expect(within(details()).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Défaite par Forfeit",
    );
    expect(details()).toHaveTextContent("· Challenge");
    expect(details()).not.toHaveTextContent("TP");
  });

  test("the details show the Duel chart with its legend, the opponent named by a link", async () => {
    await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

    const chart = within(details()).getByRole("figure", { name: "Duel chart" });

    expect(chart).toHaveTextContent("ton wpm");
    expect(chart).toHaveTextContent("wpm de @alan");
    expect(chart).toHaveTextContent("raw de chaque seconde");
    expect(chart).toHaveTextContent("Misses");
    expect(within(chart).getByRole("link", { name: "@alan" })).toHaveAttribute("href", "/u/alan");
  });

  test("the details compare both sides in a table of seven lines", async () => {
    await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

    expect(
      within(table())
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Result", "Toi", "@alan"]);
    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((header) => header.textContent),
    ).toEqual(["Score", "wpm", "raw", "précision", "régularité", "meilleur Combo", "Bursts"]);
    // Grouped by thousands with a narrow no-break space, the French way.
    expect(tableLine("Score")).toEqual(["1 234", "567"]);
    expect(tableLine("wpm")).toEqual(["42", "60"]);
    expect(tableLine("raw")).toEqual(["45", "63"]);
    expect(tableLine("précision")).toEqual(["96 %", "96 %"]);
    expect(tableLine("régularité")).toEqual(["80 %", "80 %"]);
    expect(tableLine("meilleur Combo")).toEqual(["21", "30"]);
    expect(tableLine("Bursts")).toEqual(["2", "3"]);
  });

  test("a Duel before the Score shows dashes for what it did not count", async () => {
    await renderPage(
      { duels: [entry({ id: "old", score: null, opponentScore: null })], next: null },
      [
        replayed({
          id: "old",
          me: player("ada", { score: 0, wpm: 42, pace: null }),
          opponent: player("alan", { score: 0, wpm: 60, pace: null }),
        }),
      ],
    );

    expect(tableLine("Score")).toEqual(["—", "—"]);
    expect(tableLine("meilleur Combo")).toEqual(["—", "—"]);
    expect(tableLine("wpm")).toEqual(["42", "60"]);
  });

  test("a deleted opponent: « User supprimé », no link, the User's column only", async () => {
    await renderPage(
      {
        duels: [entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null })],
        next: null,
      },
      [replayed({ id: "deleted", opponent: null })],
    );

    expect(row(0)).toHaveTextContent("User supprimé");
    expect(details()).toHaveTextContent("contre User supprimé");
    expect(screen.queryAllByRole("link", { name: /^@/ })).toHaveLength(0);
    expect(
      within(table())
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Result", "Toi"]);
  });

  test("the details load with a skeleton, the list already there", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => {})),
    );

    await renderPage({ duels: [entry({ id: "won" })], next: null });

    expect(rows()).toHaveLength(1);
    expect(within(details()).getByRole("heading", { level: 2 })).toHaveTextContent("Victoire");
    expect(
      within(details()).getByRole("status", { name: "Chargement du Duel" }),
    ).toBeInTheDocument();
  });

  test("details that cannot be read say so, the list still there", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: { code: "INTERNAL_SERVER_ERROR", message: "boom", requestId: "r" },
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    await renderPage({ duels: [entry({ id: "won" })], next: null });

    expect(
      await within(details()).findByRole("heading", { name: "Duel illisible" }),
    ).toBeInTheDocument();
    expect(within(details()).getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
    expect(rows()).toHaveLength(1);
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

    await renderPage({ duels: [entry({ id: "recent" })], next: "1000:recent" }, [
      replayed({ id: "recent" }),
    ]);

    expect(
      await within(screen.getByRole("list", { name: "Duel history" })).findByText("@linus"),
    ).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
    expect(String(fetch.mock.calls[0]?.[0])).toContain("before=1000%3Arecent");
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("the header, then each Duel: its date, Scores grouped and outcome the English way", async () => {
      await renderPage({
        duels: [
          entry({ id: "won", ranked: true, tp: 18 }),
          entry({
            id: "forfeited",
            outcome: "loss",
            forfeit: true,
            ranked: true,
            tp: -15,
            score: 1284,
            opponent: { handle: "grace", image: null },
          }),
          entry({ id: "challenge" }),
          entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null }),
        ],
        next: null,
      });

      expect(
        screen.getByText("Your finished Duels, newest first. Pick one to see its Duel chart."),
      ).toBeInTheDocument();

      const [won, forfeited, challenge, deleted] = rows();

      expect(won).toHaveTextContent(/Sep 20, 2026, \d{1,2}:\d\d\s[AP]M/);
      expect(won).toHaveTextContent("1,200800");
      expect(won).toHaveTextContent("Victory+18 TP");
      expect(forfeited).toHaveTextContent("· Forfeit");
      expect(forfeited).toHaveTextContent("1,284");
      expect(forfeited).toHaveTextContent("Defeat−15 TP");
      expect(challenge).toHaveTextContent("VictoryChallenge");
      expect(deleted).toHaveTextContent("Deleted User");
      // The row's button is named by its opponent first, then what it shows.
      expect(within(row(0)).getByRole("button", { name: /^Duel vs\. @alan/ })).toBeInTheDocument();
    });

    test("the details: against whom, when, what kind, the chart's legend and the Replay", async () => {
      await renderPage({ duels: [entry({ id: "won", ranked: true, tp: 18 })], next: null }, [
        replayed({ id: "won", ranked: true, tp: 18 }),
      ]);

      expect(englishDetails()).toHaveTextContent(/vs\. @alan · Sep 20, 2026, .* · Ranked Duel/);

      const chart = within(englishDetails()).getByRole("figure", { name: "Duel chart" });

      expect(chart).toHaveTextContent("your wpm");
      expect(chart).toHaveTextContent("@alan's wpm");
      expect(chart).toHaveTextContent("raw per second");
      expect(chart).toHaveTextContent("Misses");
      expect(within(chart).getByRole("link", { name: "@alan" })).toHaveAttribute("href", "/u/alan");
      expect(
        within(englishDetails()).getByRole("button", { name: "Watch the Replay" }),
      ).toHaveAttribute("href", "/duels/won");
    });

    test("the Results table, its lines named and its figures written the English way", async () => {
      await renderPage({ duels: [entry({ id: "won" })], next: null }, [replayed({ id: "won" })]);

      expect(
        within(englishTable())
          .getAllByRole("columnheader")
          .map((header) => header.textContent),
      ).toEqual(["Result", "You", "@alan"]);
      expect(
        within(englishTable())
          .getAllByRole("rowheader")
          .map((header) => header.textContent),
      ).toEqual(["Score", "wpm", "raw", "accuracy", "consistency", "best Combo", "Bursts"]);
      expect(englishLine("Score")).toEqual(["1,234", "567"]);
      expect(englishLine("accuracy")).toEqual(["96%", "96%"]);
      expect(englishLine("consistency")).toEqual(["80%", "80%"]);
    });

    test("a deleted opponent is a Deleted User, the User's column alone", async () => {
      await renderPage(
        {
          duels: [entry({ id: "deleted", opponent: null, opponentScore: null, opponentWpm: null })],
          next: null,
        },
        [replayed({ id: "deleted", opponent: null })],
      );

      expect(englishDetails()).toHaveTextContent("vs. Deleted User");
      expect(
        within(row(0)).getByRole("button", { name: /^Duel vs\. Deleted User/ }),
      ).toBeInTheDocument();
      expect(
        within(englishTable())
          .getAllByRole("columnheader")
          .map((header) => header.textContent),
      ).toEqual(["Result", "You"]);
    });

    test("the details' loading and their error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                error: { code: "INTERNAL_SERVER_ERROR", message: "boom", requestId: "r" },
              }),
              { status: 500, headers: { "content-type": "application/json" } },
            ),
        ),
      );

      await renderPage({ duels: [entry({ id: "won" })], next: null });

      expect(
        within(englishDetails()).getByRole("status", { name: "Loading the Duel" }),
      ).toBeInTheDocument();
      expect(
        await within(englishDetails()).findByRole("heading", { name: "Couldn't load this Duel" }),
      ).toBeInTheDocument();
      expect(
        within(englishDetails()).getByRole("button", { name: "Try again" }),
      ).toBeInTheDocument();
    });

    test("no Duel yet", async () => {
      await renderPage({ duels: [], next: null });

      expect(screen.getByText("No Duels yet")).toBeInTheDocument();
      expect(
        screen.getByText("Your Duel history fills up with every Duel you finish."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start a Duel" })).toHaveAttribute("href", "/");
    });
  });
});

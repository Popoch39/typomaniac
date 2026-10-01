import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  type DuelHistoryEntry,
  type HistoryActivity,
  historyActivityQueryOptions,
  historyWeekQueryOptions,
} from "@/api/duel-history";
import { type Me, meQueryOptions } from "@/api/me";
import { friezeRange, weekRange } from "@/components/history/history-week";
import { loadHistory } from "@/components/history/load-history";
import { HistoryPage } from "@/pages/history-page";
import { HistoryPendingPage } from "@/pages/history-pending-page";
import { Route as HistoryRoute } from "@/routes/history";
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
  place: null,
};

// Thursday 1 October 2026, in the afternoon, in the time zone the tests run in.
const NOW = new Date(2026, 9, 1, 15, 0);

const at = (month: number, day: number, hour: number, minute = 0) =>
  new Date(2026, month, day, hour, minute).getTime();

const CURRENT_WEEK = "2026-09-28";

const entry = (overrides: Partial<DuelHistoryEntry>): DuelHistoryEntry => ({
  id: "duel-1",
  endedAt: at(9, 1, 10, 40),
  opponent: { handle: "alan", image: null },
  outcome: "win",
  forfeit: false,
  score: 1200,
  opponentScore: 800,
  wpm: 90,
  opponentWpm: 70,
  tp: null,
  ranked: false,
  roundsToWin: 1,
  roundsWon: 1,
  opponentRoundsWon: 0,
  wpmBySecond: [0, 60, 90],
  opponentWpmBySecond: [0, 40, 70],
  ...overrides,
});

// Three Duels of the current week: two today, one on Monday.
const thisWeek: DuelHistoryEntry[] = [
  entry({ id: "won", endedAt: at(9, 1, 14, 5), ranked: true, tp: 18 }),
  entry({
    id: "lost",
    endedAt: at(9, 1, 9, 30),
    outcome: "loss",
    ranked: true,
    tp: -12,
    opponent: { handle: "grace", image: null },
  }),
  entry({ id: "challenge", endedAt: at(8, 28, 21, 0), outcome: "draw", score: 900 }),
];

const activity = (first: number | null): HistoryActivity => ({
  days: [
    { day: "2026-09-28", duels: 1 },
    { day: "2026-10-01", duels: 2 },
    { day: "2026-09-22", duels: 6 },
  ],
  first,
});

type Weeks = Record<string, DuelHistoryEntry[]>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// The page at `url`, the Duels of each week of `weeks` (by its Monday) and the frieze's Activity
// already read through Query, with the route's own search, loader and its reading of the clock.
const renderPage = async (
  weeks: Weeks,
  url = "/history",
  { frieze = activity(at(5, 1, 12)), friezeEnd = CURRENT_WEEK } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(historyActivityQueryOptions(friezeRange(friezeEnd)).queryKey, frieze);

  for (const [week, duels] of Object.entries(weeks)) {
    queryClient.setQueryData(historyWeekQueryOptions(weekRange(week)).queryKey, { duels });
  }

  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()();

  const historyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/history",
    validateSearch: HistoryRoute.options.validateSearch,
    loaderDeps: ({ search }) => ({ week: search.week }),
    loader: ({ context, deps }) => loadHistory(context.queryClient, deps.week, Date.now()),
    component: HistoryPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([historyRoute]),
    history: createMemoryHistory({ initialEntries: [url] }),
    context: { queryClient },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { level: 1 });

  return router;
};

const weekNav = () => screen.getByRole("navigation", { name: "Semaine affichée" });

const frieze = () => screen.getByRole("region", { name: "Semaines" });

const day = (name: string) => screen.getByRole("region", { name });

const cards = (name: string) => within(day(name)).getAllByRole("listitem");

const card = (dayName: string, index: number) => {
  const found = cards(dayName)[index];

  if (found === undefined) {
    throw new Error(`No card ${index} on ${dayName}`);
  }

  return found;
};

describe("HistoryPage", () => {
  test("names the page and the week shown, the current one by default", async () => {
    await renderPage({ [CURRENT_WEEK]: thisWeek });

    expect(screen.getByRole("heading", { level: 1, name: "Historique" })).toBeInTheDocument();
    expect(screen.getByText("Tes Duels, une semaine à la fois.")).toBeInTheDocument();
    expect(within(weekNav()).getByText("28 sept. – 4 oct.")).toBeInTheDocument();
    expect(within(weekNav()).getByRole("button", { name: "Semaine suivante" })).toBeDisabled();
    expect(within(weekNav()).getByRole("button", { name: "Semaine précédente" })).toHaveAttribute(
      "href",
      "/history?week=2026-09-21",
    );
    expect(within(weekNav()).getByRole("button", { name: "Cette semaine" })).toHaveAttribute(
      "href",
      "/history",
    );
  });

  test("a frieze of 16 weeks leads to each, beside the week's tally", async () => {
    await renderPage({ [CURRENT_WEEK]: thisWeek });

    const weeks = within(frieze()).getAllByRole("link");

    expect(weeks).toHaveLength(16);
    expect(weeks[0]).toHaveAccessibleName("Semaine du 15 juin");
    expect(weeks[14]).toHaveAttribute("href", "/history?week=2026-09-21");
    expect(weeks[15]).toHaveAttribute("href", "/history");
    expect(within(frieze()).getByText("16 semaines")).toBeInTheDocument();

    const tally = within(frieze())
      .getAllByRole("definition")
      .map((figure) => figure.textContent);

    const terms = within(frieze())
      .getAllByRole("term")
      .map((term) => term.textContent);

    expect(terms).toEqual(["Duels", "Victoires", "TP"]);
    expect(tally).toEqual(["3", "1", "+6"]);
  });

  test("each day of the frieze tells its Duels and its date under the pointer, not the days to come", async () => {
    await renderPage({ [CURRENT_WEEK]: thisWeek });

    const days = within(frieze())
      .getByRole("link", { name: "Semaine du 28 sept." })
      .querySelectorAll("[data-slot='tooltip-trigger']");

    // Monday to Thursday: Friday to Sunday are still to come.
    expect(days).toHaveLength(4);

    await userEvent.hover(days[0] ?? document.body);

    const tooltip = await screen.findByRole("tooltip");

    expect(tooltip).toHaveTextContent("1 Duel");
    expect(tooltip).toHaveTextContent("lundi 28 sept.");

    await userEvent.hover(days[1] ?? document.body);

    expect(await screen.findByRole("tooltip", { name: /Aucun Duel/ })).toHaveTextContent(
      "mardi 29 sept.",
    );
  });

  test("the week's Duels by day, the most recent first, each day's tally beside its name", async () => {
    await renderPage({ [CURRENT_WEEK]: thisWeek });

    const days = screen.getAllByRole("heading", { level: 2 }).map((title) => title.textContent);

    expect(days).toEqual(["Aujourd'hui", "lundi 28 sept."]);
    expect(within(day("Aujourd'hui")).getByText("2 Duels · 1 V 1 D · +6 TP")).toBeInTheDocument();
    expect(
      within(day("lundi 28 sept.")).getByText("1 Duel · 0 V 0 D 1 N · +0 TP"),
    ).toBeInTheDocument();
    expect(cards("Aujourd'hui")).toHaveLength(2);
  });

  test("a card: how it ended, its TP, the opponent and when, both Scores and its Replay", async () => {
    await renderPage({ [CURRENT_WEEK]: thisWeek });

    const won = card("Aujourd'hui", 0);

    expect(within(won).getByText("Victoire")).toBeInTheDocument();
    expect(within(won).getByText("+18 TP")).toBeInTheDocument();
    expect(within(won).getByRole("link", { name: "@alan" })).toHaveAttribute("href", "/u/alan");
    expect(within(won).getByText("14:05 · Ranked")).toBeInTheDocument();
    expect(won).toHaveTextContent("1 200 vs 800");
    expect(within(won).getByRole("link", { name: "Replay" })).toHaveAttribute(
      "href",
      "/history/won",
    );
    expect(won.querySelectorAll("polyline")).toHaveLength(2);

    expect(within(card("Aujourd'hui", 1)).getByText("−12 TP")).toBeInTheDocument();
    expect(within(card("lundi 28 sept.", 0)).getByText("Challenge")).toBeInTheDocument();
    expect(within(card("lundi 28 sept.", 0)).getByText("Draw")).toBeInTheDocument();
  });

  test("a Forfeit, a Duel in Placement, before the Score and against a deleted User", async () => {
    await renderPage({
      [CURRENT_WEEK]: [
        entry({
          id: "forfeit",
          forfeit: true,
          ranked: true,
          tp: null,
          opponent: null,
          score: null,
          opponentScore: null,
          opponentWpm: null,
          opponentWpmBySecond: null,
        }),
      ],
    });

    const forfeit = card("Aujourd'hui", 0);

    expect(within(forfeit).getByText("10:40 · Ranked · Forfeit")).toBeInTheDocument();
    expect(within(forfeit).getByText("User supprimé")).toBeInTheDocument();
    expect(within(forfeit).queryByText(/TP/)).not.toBeInTheDocument();
    expect(forfeit).toHaveTextContent("— vs —");
    expect(forfeit.querySelectorAll("polyline")).toHaveLength(1);
  });

  test("a Bo3's card shows the count of its Rounds in place of the Scores, and its last Round's spark", async () => {
    await renderPage({
      [CURRENT_WEEK]: [
        entry({
          id: "bo3",
          ranked: true,
          tp: 18,
          roundsToWin: 2,
          roundsWon: 2,
          opponentRoundsWon: 1,
          score: 1309,
          opponentScore: 1158,
        }),
        entry({
          id: "bo3-gone",
          endedAt: at(9, 1, 9, 0),
          outcome: "loss",
          ranked: true,
          roundsToWin: 2,
          roundsWon: 0,
          opponentRoundsWon: null,
          opponent: null,
        }),
      ],
    });

    const bo3 = card("Aujourd'hui", 0);

    expect(bo3).toHaveTextContent("2 vs 1");
    expect(bo3).not.toHaveTextContent("1 309");
    // The spark of its last Round, as the API gives it.
    expect(bo3.querySelectorAll("polyline")).toHaveLength(2);
    // Against a deleted User, their count is gone with them.
    expect(card("Aujourd'hui", 1)).toHaveTextContent("0 vs —");
  });

  test("a week without a Duel says so, with a way to play", async () => {
    await renderPage({ [CURRENT_WEEK]: [] });

    expect(screen.getByRole("heading", { name: "Aucun Duel cette semaine" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lancer un Duel" })).toHaveAttribute("href", "/");
    expect(
      within(frieze())
        .getAllByRole("definition")
        .map((f) => f.textContent),
    ).toEqual(["0", "0", "+0"]);
  });

  test("a past week from the URL, its frieze still ending today, on to the next week", async () => {
    await renderPage(
      { "2026-09-21": [entry({ id: "past", endedAt: at(8, 22, 20) })] },
      "/history?week=2026-09-24",
    );

    expect(within(weekNav()).getByText("21 sept. – 27 sept.")).toBeInTheDocument();
    expect(within(weekNav()).getByRole("button", { name: "Semaine suivante" })).toHaveAttribute(
      "href",
      "/history",
    );
    expect(screen.getByRole("heading", { level: 2, name: "mardi 22 sept." })).toBeInTheDocument();
    expect(within(frieze()).getAllByRole("link")[15]).toHaveAttribute("href", "/history");
  });

  test("going back stops at the week of the first Duel", async () => {
    await renderPage({ [CURRENT_WEEK]: thisWeek }, "/history", {
      frieze: activity(at(8, 29, 12)),
    });

    expect(within(weekNav()).getByRole("button", { name: "Semaine précédente" })).toBeDisabled();
  });

  test("a week picked on the frieze is shown", async () => {
    const router = await renderPage({
      [CURRENT_WEEK]: thisWeek,
      "2026-09-21": [entry({ id: "past", endedAt: at(8, 22, 20) })],
    });

    await userEvent.click(within(frieze()).getByRole("link", { name: "Semaine du 21 sept." }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "mardi 22 sept." }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ week: "2026-09-21" });
  });

  test("in English", async () => {
    useLocaleStore.setState({ locale: "en" });
    await renderPage({ [CURRENT_WEEK]: thisWeek });

    expect(screen.getByRole("heading", { level: 1, name: "History" })).toBeInTheDocument();
    expect(screen.getByText("Sep 28 – Oct 4")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((title) => title.textContent)).toEqual([
      "Today",
      "Monday, Sep 28",
    ]);
    expect(screen.getByText("2 Duels · 1 W 1 L · +6 TP")).toBeInTheDocument();
    expect(within(card("Today", 0)).getByText("2:05 PM · Ranked")).toBeInTheDocument();
    expect(card("Today", 0)).toHaveTextContent("1,200 vs 800");
  });
});

describe("HistoryPendingPage", () => {
  test("holds the places of the frieze and the cards while the week loads", () => {
    render(<HistoryPendingPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Historique" })).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Chargement de ton historique" }),
    ).toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { type DuelHistoryPage, duelHistoryQueryOptions } from "@/api/duel-history";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelsPage } from "@/pages/duels-page";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
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
const renderPage = async (first: DuelHistoryPage) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, me);
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

  test("each Duel leads to its Replay", async () => {
    await renderPage({ duels: [entry({ id: "won" }), entry({ id: "drawn" })], next: null });

    expect(rows().map((row) => within(row).getByRole("link").getAttribute("href"))).toEqual([
      "/duels/won",
      "/duels/drawn",
    ]);
  });

  test("says the Duel history fills up by playing when there is none yet", async () => {
    await renderPage({ duels: [], next: null });

    expect(screen.queryByRole("list", { name: "Duel history" })).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun Duel pour l'instant/)).toBeInTheDocument();
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

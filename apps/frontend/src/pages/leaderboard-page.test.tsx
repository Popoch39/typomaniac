import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  type Leaderboard,
  type LeaderboardEntry,
  leaderboardQueryOptions,
} from "@/api/leaderboard";
import { type Me, meQueryOptions } from "@/api/me";
import { LeaderboardPage } from "@/pages/leaderboard-page";

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

const entry = (
  position: number,
  handle: string,
  ornament: LeaderboardEntry["ornament"] = null,
): LeaderboardEntry => ({
  position,
  handle,
  image: null,
  ornament,
  rank: { tier: "or", division: 2, tp: 42, shielded: false },
});

// The Tier of the Ornament the row's avatar wears, none without one.
const ornamentOf = (row: HTMLElement) =>
  row.querySelector("[data-ornament] use")?.getAttribute("href") ?? null;

// The page at `/leaderboard`, the Classement already read through Query.
const renderPage = async (user: Me | null, leaderboard: Leaderboard) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  queryClient.setQueryData(meQueryOptions.queryKey, user);
  queryClient.setQueryData(leaderboardQueryOptions.queryKey, leaderboard);

  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()();

  const leaderboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/leaderboard",
    component: LeaderboardPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([leaderboardRoute]),
    history: createMemoryHistory({ initialEntries: ["/leaderboard"] }),
    context: { queryClient },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  await screen.findByRole("heading");
};

describe("LeaderboardPage", () => {
  test("invites a Visitor to sign in", async () => {
    await renderPage(null, { entries: [], me: null });

    expect(screen.getByRole("button", { name: "Se connecter" })).toBeTruthy();
  });

  test("says nobody is ranked yet, with a way to play", async () => {
    await renderPage(me, { entries: [], me: null });

    expect(screen.getByText("Personne n'est encore classé")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jouer" })).toBeTruthy();
  });

  test("lists the Users in their order, the reader's line highlighted", async () => {
    await renderPage(me, {
      entries: [entry(1, "alan"), entry(2, "ada"), entry(3, "grace")],
      me: entry(2, "ada"),
    });

    const rows = within(screen.getByRole("list", { name: "Classement" })).getAllByRole("listitem");

    expect(rows.map((row) => row.textContent)).toEqual([
      "1A@alanOr II · 42 TP",
      "2A@adaToiOr II · 42 TP",
      "3G@graceOr II · 42 TP",
    ]);
    expect(rows[1]?.getAttribute("aria-current")).toBe("true");
    expect(rows.filter((row) => row.hasAttribute("aria-current"))).toHaveLength(1);
  });

  test("each avatar wears its User's Ornament, the reader's below the list too", async () => {
    await renderPage(me, {
      entries: [entry(1, "alan", "diamant"), entry(2, "grace")],
      me: entry(140, "ada", "argent"),
    });

    expect(screen.getAllByRole("listitem").map(ornamentOf)).toEqual([
      "#tier-ornament-diamant",
      null,
      "#tier-ornament-argent",
    ]);
  });

  test("shows the reader's line below the list when they stand further down", async () => {
    await renderPage(me, { entries: [entry(1, "alan")], me: entry(140, "ada") });

    const rows = screen.getAllByRole("listitem");

    expect(rows).toHaveLength(2);
    expect(rows[1]?.textContent).toContain("140");
    expect(rows[1]?.getAttribute("aria-current")).toBe("true");
  });
});

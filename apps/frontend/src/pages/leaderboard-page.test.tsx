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

const orII: LeaderboardEntry["rank"] = { tier: "or", division: 2, tp: 42, shielded: false };

const entry = (
  position: number,
  handle: string,
  ornament: LeaderboardEntry["ornament"] = null,
  rank: LeaderboardEntry["rank"] = orII,
): LeaderboardEntry => ({ position, handle, image: null, ornament, rank });

// The Users from `first` to `last`, in their order.
const entries = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) =>
    entry(first + index, `user${first + index}`),
  );

const podium = () => within(screen.getByRole("list", { name: "Podium" })).getAllByRole("listitem");

const listed = () =>
  within(screen.getByRole("list", { name: "Classement" })).getAllByRole("listitem");

const place = () => screen.getByRole("region", { name: "Ta place" });

const legend = () => within(screen.getByRole("region", { name: "Tiers" })).getAllByRole("listitem");

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

  await screen.findByRole("heading", { level: 1 });
};

describe("LeaderboardPage", () => {
  test("invites a Visitor to sign in, under the page's header", async () => {
    await renderPage(null, { entries: [], me: null });

    expect(screen.getByRole("heading", { level: 1, name: "Classement" })).toBeTruthy();
    expect(screen.getByText("Connecte-toi pour voir le Classement.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeTruthy();
  });

  test("says nobody is ranked yet, with a way to play", async () => {
    await renderPage(me, { entries: [], me: null });

    expect(screen.getByText("Personne n'est encore classé")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jouer" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Podium" })).toBeNull();
  });

  test("sets the first three on the podium, the others in the list from the 4th", async () => {
    await renderPage(me, { entries: entries(1, 5), me: null });

    expect(podium().map((card) => card.textContent)).toEqual([
      "1U@user1Or II · 42 TP",
      "2U@user2Or II · 42 TP",
      "3U@user3Or II · 42 TP",
    ]);
    expect(listed().map((row) => row.textContent)).toEqual([
      "4U@user4Or II · 42 TP",
      "5U@user5Or II · 42 TP",
    ]);
  });

  test("with fewer than three Users ranked, the podium shows those there are", async () => {
    await renderPage(me, { entries: entries(1, 2), me: null });

    expect(podium()).toHaveLength(2);
    expect(screen.queryByRole("list", { name: "Classement" })).toBeNull();
  });

  test("highlights the reader's line, in the list or on the podium", async () => {
    await renderPage(me, { entries: [...entries(1, 4), entry(5, "ada")], me: entry(5, "ada") });

    const rows = [...podium(), ...listed()];

    expect(listed()[1]?.textContent).toBe("5A@adaToiOr II · 42 TP");
    expect(listed()[1]?.getAttribute("aria-current")).toBe("true");
    expect(rows.filter((row) => row.hasAttribute("aria-current"))).toHaveLength(1);
  });

  test("marks the reader among the first three", async () => {
    await renderPage(me, { entries: [entry(1, "alan"), entry(2, "ada")], me: entry(2, "ada") });

    expect(podium()[1]?.textContent).toBe("2A@adaToiOr II · 42 TP");
    expect(podium()[1]?.getAttribute("aria-current")).toBe("true");
    expect(podium()[0]?.hasAttribute("aria-current")).toBe(false);
  });

  test("each avatar wears its User's Ornament, the reader's below the list too", async () => {
    await renderPage(me, {
      entries: [entry(1, "alan", "diamant"), ...entries(2, 3), entry(4, "grace", "or")],
      me: entry(140, "ada", "argent"),
    });

    expect([...podium(), ...listed()].map(ornamentOf)).toEqual([
      "#tier-ornament-diamant",
      null,
      null,
      "#tier-ornament-or",
      "#tier-ornament-argent",
    ]);
  });

  test("shows the reader's line below the list when they stand further down", async () => {
    await renderPage(me, { entries: entries(1, 4), me: entry(140, "ada") });

    const rows = listed();

    expect(rows).toHaveLength(2);
    expect(rows[1]?.textContent).toContain("140");
    expect(rows[1]?.getAttribute("aria-current")).toBe("true");
  });

  test("tells a ranked reader their place, rank and the TP left to the next one", async () => {
    await renderPage(
      { ...me, rank: orII },
      { entries: entries(1, 4), me: entry(128, "ada", "or", orII) },
    );

    expect(place().textContent).toContain("128e");
    expect(place().textContent).toContain("Or II");
    expect(place().textContent).toContain("42 TP");
    expect(within(place()).getByText("58 TP avant Or I")).toBeTruthy();
    expect(within(place()).getByRole("meter", { name: "TP de la Division" })).toBeTruthy();
  });

  test("tells the rank `/me` has, fresher than the Classement's line after a Duel", async () => {
    const platine = { tier: "platine", division: 4, tp: 6, shielded: true } as const;

    await renderPage(
      { ...me, rank: platine },
      { entries: entries(1, 4), me: entry(128, "ada", "or", orII) },
    );

    expect(place().textContent).toContain("Platine IV");
    expect(place().textContent).toContain("94 TP avant Platine III");
    expect(legend().find((tier) => tier.hasAttribute("aria-current"))?.textContent).toBe(
      "Platineton Tier",
    );
  });

  test("calls the first place 1er", async () => {
    await renderPage({ ...me, rank: orII }, { entries: [entry(1, "ada")], me: entry(1, "ada") });

    expect(place().textContent).toContain("1er");
  });

  test("asks a reader in Placement to finish it, with the Duels played", async () => {
    await renderPage({ ...me, rank: { placementsLeft: 3 } }, { entries: entries(1, 4), me: null });

    expect(within(place()).getByText("Termine ton Placement")).toBeTruthy();
    expect(within(place()).getByRole("meter", { name: "Placement" }).getAttribute("value")).toBe(
      "2",
    );
  });

  test("asks a reader without a Rating to play their Placement", async () => {
    await renderPage(me, { entries: entries(1, 4), me: null });

    expect(within(place()).getByText("Termine ton Placement")).toBeTruthy();
    expect(within(place()).queryByRole("meter")).toBeNull();
  });

  test("lays out the Tiers from Maniac to Fer, the reader's marked", async () => {
    await renderPage(
      { ...me, rank: orII },
      { entries: entries(1, 4), me: entry(128, "ada", "or", orII) },
    );

    expect(legend().map((tier) => tier.textContent)).toEqual([
      "Maniacsans Division",
      "DiamantIV à I",
      "PlatineIV à I",
      "Orton Tier",
      "ArgentIV à I",
      "BronzeIV à I",
      "FerIV à I",
    ]);
    expect(legend().filter((tier) => tier.hasAttribute("aria-current"))).toEqual([legend()[3]]);
  });

  test("marks no Tier for a reader in Placement", async () => {
    await renderPage({ ...me, rank: { placementsLeft: 3 } }, { entries: entries(1, 4), me: null });

    expect(legend().filter((tier) => tier.hasAttribute("aria-current"))).toHaveLength(0);
  });
});

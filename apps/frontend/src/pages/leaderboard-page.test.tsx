import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import {
  type Leaderboard,
  type LeaderboardEntry,
  leaderboardQueryOptions,
} from "@/api/leaderboard";
import { type Me, meQueryOptions } from "@/api/me";
import { LeaderboardPage } from "@/pages/leaderboard-page";
import { LeaderboardPendingPage } from "@/pages/leaderboard-pending-page";
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

const goldII: LeaderboardEntry["rank"] = { tier: "gold", division: 2, tp: 42, shielded: false };

const entry = (
  position: number,
  handle: string,
  ornament: LeaderboardEntry["ornament"] = null,
  rank: LeaderboardEntry["rank"] = goldII,
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

const placeIn = () => screen.getByRole("region", { name: "Where you stand" });

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
      "1U@user1Gold II · 42 TP",
      "2U@user2Gold II · 42 TP",
      "3U@user3Gold II · 42 TP",
    ]);
    expect(listed().map((row) => row.textContent)).toEqual([
      "4U@user4Gold II · 42 TP",
      "5U@user5Gold II · 42 TP",
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

    expect(listed()[1]?.textContent).toBe("5A@adaToiGold II · 42 TP");
    expect(listed()[1]?.getAttribute("aria-current")).toBe("true");
    expect(rows.filter((row) => row.hasAttribute("aria-current"))).toHaveLength(1);
  });

  test("marks the reader among the first three", async () => {
    await renderPage(me, { entries: [entry(1, "alan"), entry(2, "ada")], me: entry(2, "ada") });

    expect(podium()[1]?.textContent).toBe("2A@adaToiGold II · 42 TP");
    expect(podium()[1]?.getAttribute("aria-current")).toBe("true");
    expect(podium()[0]?.hasAttribute("aria-current")).toBe(false);
  });

  test("each avatar wears its User's Ornament, the reader's below the list too", async () => {
    await renderPage(me, {
      entries: [entry(1, "alan", "diamond"), ...entries(2, 3), entry(4, "grace", "gold")],
      me: entry(140, "ada", "silver"),
    });

    expect([...podium(), ...listed()].map(ornamentOf)).toEqual([
      "#tier-ornament-diamond",
      null,
      null,
      "#tier-ornament-gold",
      "#tier-ornament-silver",
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
      { ...me, rank: goldII },
      { entries: entries(1, 4), me: entry(128, "ada", "gold", goldII) },
    );

    expect(place().textContent).toContain("128e");
    expect(place().textContent).toContain("Gold II");
    expect(place().textContent).toContain("42 TP");
    expect(within(place()).getByText("58 TP avant Gold I")).toBeTruthy();
    expect(within(place()).getByRole("meter", { name: "TP de la Division" })).toBeTruthy();
  });

  test("tells the rank `/me` has, fresher than the Classement's line after a Duel", async () => {
    const platinum = { tier: "platinum", division: 4, tp: 6, shielded: true } as const;

    await renderPage(
      { ...me, rank: platinum },
      { entries: entries(1, 4), me: entry(128, "ada", "gold", goldII) },
    );

    expect(place().textContent).toContain("Platinum IV");
    expect(place().textContent).toContain("94 TP avant Platinum III");
    expect(legend().find((tier) => tier.hasAttribute("aria-current"))?.textContent).toBe(
      "Platinumton Tier",
    );
  });

  test("calls the first place 1er", async () => {
    await renderPage({ ...me, rank: goldII }, { entries: [entry(1, "ada")], me: entry(1, "ada") });

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

  test("lays out the Tiers from Maniac to Iron, the reader's marked", async () => {
    await renderPage(
      { ...me, rank: goldII },
      { entries: entries(1, 4), me: entry(128, "ada", "gold", goldII) },
    );

    expect(legend().map((tier) => tier.textContent)).toEqual([
      "Maniacsans Division",
      "DiamondIV à I",
      "PlatinumIV à I",
      "Goldton Tier",
      "SilverIV à I",
      "BronzeIV à I",
      "IronIV à I",
    ]);
    expect(legend().filter((tier) => tier.hasAttribute("aria-current"))).toEqual([legend()[3]]);
  });

  test("marks no Tier for a reader in Placement", async () => {
    await renderPage({ ...me, rank: { placementsLeft: 3 } }, { entries: entries(1, 4), me: null });

    expect(legend().filter((tier) => tier.hasAttribute("aria-current"))).toHaveLength(0);
  });

  test("names its loading for screen readers", () => {
    render(<LeaderboardPendingPage />);

    expect(screen.getByRole("status", { name: "Chargement du Classement" })).toBeInTheDocument();
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("invites a Visitor to sign in", async () => {
      await renderPage(null, { entries: [], me: null });

      expect(screen.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeInTheDocument();
      expect(
        screen.getByText("Ranked Users past Placement, by Tier, Division, then TP."),
      ).toBeInTheDocument();
      expect(screen.getByText("Sign in to see the Leaderboard.")).toBeInTheDocument();
    });

    test("says nobody is ranked yet, with a way to play", async () => {
      await renderPage(me, { entries: [], me: null });

      expect(screen.getByText("Nobody's ranked yet")).toBeInTheDocument();
      expect(
        screen.getByText(
          "A User joins the Leaderboard after their 5 Placement Duels. Start a Duel to get on it.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    test("names the podium and the list, the reader's line marked You", async () => {
      await renderPage(me, { entries: [...entries(1, 4), entry(5, "ada")], me: entry(5, "ada") });

      expect(screen.getByRole("list", { name: "Podium" })).toBeInTheDocument();
      expect(
        within(screen.getByRole("list", { name: "Leaderboard" })).getAllByRole("listitem")[1]
          ?.textContent,
      ).toBe("5A@adaYouGold II · 42 TP");
    });

    test("groups the thousands of a reader's place far down", async () => {
      await renderPage(me, { entries: entries(1, 4), me: entry(1284, "ada") });

      const rows = within(screen.getByRole("list", { name: "Leaderboard" })).getAllByRole(
        "listitem",
      );

      expect(rows.at(-1)?.textContent).toContain("1,284");
    });

    test.each([
      [1, "1st"],
      [2, "2nd"],
      [23, "23rd"],
      [128, "128th"],
    ])("tells a ranked reader at place %i they are %s", async (position, words) => {
      await renderPage(
        { ...me, rank: goldII },
        { entries: entries(1, 4), me: entry(position, "ada", "gold", goldII) },
      );

      expect(placeIn().textContent).toContain(words);
      expect(placeIn().textContent).toContain("Gold II");
      expect(within(placeIn()).getByText("58 TP to Gold I")).toBeInTheDocument();
    });

    test("groups a Maniac's TP", async () => {
      const maniac = { tier: "maniac", tp: 1284, shielded: false } as const;

      await renderPage(
        { ...me, rank: maniac },
        { entries: entries(1, 4), me: entry(1, "ada", "maniac", maniac) },
      );

      expect(placeIn().textContent).toContain("1,284 TP");
    });

    test("asks a reader in Placement to finish it", async () => {
      await renderPage(
        { ...me, rank: { placementsLeft: 3 } },
        { entries: entries(1, 4), me: null },
      );

      expect(within(placeIn()).getByText("Finish your Placement")).toBeInTheDocument();
      expect(
        within(placeIn()).getByText("Your 5 Placement Duels get you on the Leaderboard."),
      ).toBeInTheDocument();
    });

    test("lays out the Tiers, their Divisions and the reader's", async () => {
      await renderPage(
        { ...me, rank: goldII },
        { entries: entries(1, 4), me: entry(128, "ada", "gold", goldII) },
      );

      expect(legend().map((tier) => tier.textContent)).toEqual([
        "Maniacno Division",
        "DiamondIV to I",
        "PlatinumIV to I",
        "Goldyour Tier",
        "SilverIV to I",
        "BronzeIV to I",
        "IronIV to I",
      ]);
    });

    test("names its loading for screen readers", () => {
      render(<LeaderboardPendingPage />);

      expect(screen.getByRole("status", { name: "Loading the Leaderboard" })).toBeInTheDocument();
    });
  });
});

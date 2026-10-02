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
import { beforeEach, describe, expect, test } from "vitest";

import {
  type Leaderboard,
  type LeaderboardEntry,
  leaderboardQueryOptions,
  type LeaderboardSearch,
} from "@/api/leaderboard";
import { type Me, meQueryOptions } from "@/api/me";
import { LeaderboardPage } from "@/pages/leaderboard-page";
import { LeaderboardPendingPage } from "@/pages/leaderboard-pending-page";
import { Route as LeaderboardRoute } from "@/routes/leaderboard";
import { useLocaleStore } from "@/stores/locale-store";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  hasPhoto: false,
  handle: "ada",
  rank: null,
  ornament: null,
  ornamentChoice: null,
  place: null,
};

const goldII: LeaderboardEntry["rank"] = { tier: "gold", division: 2, tp: 42, shielded: false };

const entry = (
  place: number,
  handle: string,
  ornament: LeaderboardEntry["ornament"] = null,
  rank: LeaderboardEntry["rank"] = goldII,
): LeaderboardEntry => ({ place, handle, image: null, ornament, rank });

// The Users from `first` to `last`, in their order.
const entries = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) =>
    entry(first + index, `user${first + index}`),
  );

// A page of the Leaderboard: its rows and the reader's line; alone, unless `around` says otherwise.
const page = (
  rows: LeaderboardEntry[],
  reader: LeaderboardEntry | null,
  around: Partial<Pick<Leaderboard, "total" | "previous" | "next">> = {},
): Leaderboard => ({
  entries: rows,
  me: reader,
  firstPlace: rows[0]?.place ?? 1,
  lastPlace: rows.at(-1)?.place ?? 0,
  total: rows.length,
  previous: null,
  next: null,
  ...around,
});

const podium = () => within(screen.getByRole("list", { name: "Podium" })).getAllByRole("listitem");

const listed = () =>
  within(screen.getByRole("list", { name: "Classement" })).getAllByRole("listitem");

const place = () => screen.getByRole("region", { name: "Ta place" });

const legend = () => within(screen.getByRole("region", { name: "Tiers" })).getAllByRole("listitem");

const placeIn = () => screen.getByRole("region", { name: "Where you stand" });

const pages = () => screen.getByRole("navigation", { name: "Pages du Classement" });

// The Tier of the Ornament the row's avatar wears, none without one.
const ornamentOf = (row: HTMLElement) =>
  row.querySelector("[data-ornament] use")?.getAttribute("href") ?? null;

// The page at `url`, each page of the Leaderboard in `read` already read through Query: the first
// page alone when given a Leaderboard.
const renderPage = async (
  user: Me | null,
  read: Leaderboard | [LeaderboardSearch, Leaderboard][],
  url = "/leaderboard",
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, user);

  for (const [search, leaderboard] of Array.isArray(read) ? read : [[{}, read] as const]) {
    queryClient.setQueryData(leaderboardQueryOptions(search).queryKey, leaderboard);
  }

  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()();

  const leaderboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/leaderboard",
    validateSearch: LeaderboardRoute.options.validateSearch,
    component: LeaderboardPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([leaderboardRoute]),
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

describe("LeaderboardPage", () => {
  test("invites a Visitor to sign in, under the page's header", async () => {
    await renderPage(null, page([], null));

    expect(screen.getByRole("heading", { level: 1, name: "Classement" })).toBeTruthy();
    expect(screen.getByText("Connecte-toi pour voir le Classement.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeTruthy();
  });

  test("says nobody is ranked yet, with a way to play", async () => {
    await renderPage(me, page([], null));

    expect(screen.getByText("Personne n'est encore classé")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jouer" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Podium" })).toBeNull();
  });

  test("sets the first three on the podium, the others in the list from the 4th", async () => {
    await renderPage(me, page(entries(1, 5), null));

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
    await renderPage(me, page(entries(1, 2), null));

    expect(podium()).toHaveLength(2);
    expect(screen.queryByRole("list", { name: "Classement" })).toBeNull();
  });

  test("highlights the reader's line, in the list or on the podium", async () => {
    await renderPage(me, page([...entries(1, 4), entry(5, "ada")], entry(5, "ada")));

    const rows = [...podium(), ...listed()];

    expect(listed()[1]?.textContent).toBe("5A@adaToiGold II · 42 TP");
    expect(listed()[1]?.getAttribute("aria-current")).toBe("true");
    expect(rows.filter((row) => row.hasAttribute("aria-current"))).toHaveLength(1);
  });

  test("marks the reader among the first three", async () => {
    await renderPage(me, page([entry(1, "alan"), entry(2, "ada")], entry(2, "ada")));

    expect(podium()[1]?.textContent).toBe("2A@adaToiGold II · 42 TP");
    expect(podium()[1]?.getAttribute("aria-current")).toBe("true");
    expect(podium()[0]?.hasAttribute("aria-current")).toBe(false);
  });

  test("each avatar wears its User's Ornament", async () => {
    await renderPage(
      me,
      page([entry(1, "alan", "diamond"), ...entries(2, 3), entry(4, "grace", "gold")], null),
    );

    expect([...podium(), ...listed()].map(ornamentOf)).toEqual([
      "#tier-ornament-diamond",
      null,
      null,
      "#tier-ornament-gold",
    ]);
  });

  test("leaves the reader's line off a page they are not on", async () => {
    await renderPage(me, page(entries(1, 4), entry(140, "ada"), { total: 200, next: "c" }));

    expect(listed()).toHaveLength(1);
    expect([...podium(), ...listed()].some((row) => row.hasAttribute("aria-current"))).toBe(false);
    expect(place().textContent).toContain("140e");
  });

  describe("its pages", () => {
    const second = page(entries(26, 50), null, { total: 60, previous: "p", next: "n" });

    test("show the list alone past the first, from its first Place", async () => {
      await renderPage(me, [[{ after: "a" }, second]], "/leaderboard?after=a");

      expect(screen.queryByRole("list", { name: "Podium" })).toBeNull();
      expect(listed()).toHaveLength(25);
      expect(listed()[0]?.textContent).toBe("26U@user26Gold II · 42 TP");
      expect(screen.getByRole("list", { name: "Classement" }).getAttribute("start")).toBe("26");
    });

    test("say which Places they show, with links to the first page, the one before and after", async () => {
      await renderPage(me, [[{ after: "a" }, second]], "/leaderboard?after=a");

      expect(within(pages()).getByText("Places 26 à 50 sur 60")).toBeTruthy();
      expect(
        within(pages()).getByRole("link", { name: "Première page" }).getAttribute("href"),
      ).toBe("/leaderboard");
      expect(within(pages()).getByRole("link", { name: "Précédente" }).getAttribute("href")).toBe(
        "/leaderboard?before=p",
      );
      expect(within(pages()).getByRole("link", { name: "Suivante" }).getAttribute("href")).toBe(
        "/leaderboard?after=n",
      );
    });

    test("have no way back on the first page, nor further on the last", async () => {
      await renderPage(me, [
        [{}, page(entries(1, 25), null, { total: 26, next: "n" })],
        [{ after: "n" }, page(entries(26, 26), null, { total: 26, previous: "p" })],
      ]);

      expect(within(pages()).getByRole("button", { name: "Première page" })).toBeDisabled();
      expect(within(pages()).getByRole("button", { name: "Précédente" })).toBeDisabled();

      await userEvent.click(within(pages()).getByRole("link", { name: "Suivante" }));

      expect(await within(pages()).findByText("Places 26 à 26 sur 26")).toBeTruthy();
      expect(within(pages()).getByRole("button", { name: "Suivante" })).toBeDisabled();
    });

    test("need no bar when the Leaderboard fits on one", async () => {
      await renderPage(me, page(entries(1, 12), null));

      expect(screen.queryByRole("navigation", { name: "Pages du Classement" })).toBeNull();
    });
  });

  describe("« Ta place »", () => {
    test("leads to the reader's own page, their line in view with the focus", async () => {
      const readerPage = page(
        [...entries(126, 127), entry(128, "ada"), ...entries(129, 150)],
        null,
        {
          total: 300,
          previous: "p",
          next: "n",
        },
      );

      const router = await renderPage({ ...me, rank: goldII }, [
        [{}, page(entries(1, 25), entry(128, "ada"), { total: 300, next: "n" })],
        [{ at: "me" }, { ...readerPage, me: entry(128, "ada") }],
      ]);

      await userEvent.click(within(place()).getByRole("button", { name: "Aller à ma page" }));

      const mine = await within(await screen.findByRole("list", { name: "Classement" })).findByRole(
        "listitem",
        { current: true },
      );

      expect(router.state.location.search).toEqual({ at: "me" });
      expect(mine.textContent).toBe("128A@adaToiGold II · 42 TP");
      expect(document.activeElement).toBe(mine);
    });

    test("leads nowhere in Placement", async () => {
      await renderPage({ ...me, rank: { placementsLeft: 3 } }, page(entries(1, 4), null));

      expect(within(place()).queryByRole("button", { name: "Aller à ma page" })).toBeNull();
    });
  });

  test("tells a ranked reader their place, rank and the TP left to the next one", async () => {
    await renderPage(
      { ...me, rank: goldII },
      page(entries(1, 4), entry(128, "ada", "gold", goldII), { total: 200, next: "n" }),
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
      page(entries(1, 4), entry(128, "ada", "gold", goldII), { total: 200, next: "n" }),
    );

    expect(place().textContent).toContain("Platinum IV");
    expect(place().textContent).toContain("94 TP avant Platinum III");
    expect(legend().find((tier) => tier.hasAttribute("aria-current"))?.textContent).toBe(
      "Platinumton Tier",
    );
  });

  test("calls the first place 1er", async () => {
    await renderPage({ ...me, rank: goldII }, page([entry(1, "ada")], entry(1, "ada")));

    expect(place().textContent).toContain("1er");
  });

  test("asks a reader in Placement to finish it, with the Duels played", async () => {
    await renderPage({ ...me, rank: { placementsLeft: 3 } }, page(entries(1, 4), null));

    expect(within(place()).getByText("Termine ton Placement")).toBeTruthy();
    expect(within(place()).getByRole("meter", { name: "Placement" }).getAttribute("value")).toBe(
      "2",
    );
  });

  test("asks a reader without a Rating to play their Placement", async () => {
    await renderPage(me, page(entries(1, 4), null));

    expect(within(place()).getByText("Termine ton Placement")).toBeTruthy();
    expect(within(place()).queryByRole("meter")).toBeNull();
  });

  test("lays out the Tiers from Maniac to Iron, the reader's marked", async () => {
    await renderPage(
      { ...me, rank: goldII },
      page(entries(1, 4), entry(128, "ada", "gold", goldII), { total: 200, next: "n" }),
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
    await renderPage({ ...me, rank: { placementsLeft: 3 } }, page(entries(1, 4), null));

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
      await renderPage(null, page([], null));

      expect(screen.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeInTheDocument();
      expect(
        screen.getByText("Ranked Users past Placement, by Tier, Division, then TP."),
      ).toBeInTheDocument();
      expect(screen.getByText("Sign in to see the Leaderboard.")).toBeInTheDocument();
    });

    test("says nobody is ranked yet, with a way to play", async () => {
      await renderPage(me, page([], null));

      expect(screen.getByText("Nobody's ranked yet")).toBeInTheDocument();
      expect(
        screen.getByText(
          "A User joins the Leaderboard after their 5 Placement Duels. Start a Duel to get on it.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    test("names the podium and the list, the reader's line marked You", async () => {
      await renderPage(me, page([...entries(1, 4), entry(5, "ada")], entry(5, "ada")));

      expect(screen.getByRole("list", { name: "Podium" })).toBeInTheDocument();
      expect(
        within(screen.getByRole("list", { name: "Leaderboard" })).getAllByRole("listitem")[1]
          ?.textContent,
      ).toBe("5A@adaYouGold II · 42 TP");
    });

    test("groups the thousands of a Place far down, and of the pages' range", async () => {
      await renderPage(
        me,
        [
          [
            { at: "me" },
            page(entries(1276, 1300), entry(1284, "ada"), {
              total: 4812,
              previous: "p",
              next: "n",
            }),
          ],
        ],
        "/leaderboard?at=me",
      );

      const rows = within(screen.getByRole("list", { name: "Leaderboard" })).getAllByRole(
        "listitem",
      );

      expect(rows.at(0)?.textContent).toContain("1,276");
      expect(
        within(screen.getByRole("navigation", { name: "Leaderboard pages" })).getByText(
          "Places 1,276–1,300 of 4,812",
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Go to my page" })).toBeInTheDocument();
    });

    test.each([
      [1, "1st"],
      [2, "2nd"],
      [23, "23rd"],
      [128, "128th"],
    ])("tells a ranked reader at place %i they are %s", async (at, words) => {
      await renderPage(
        { ...me, rank: goldII },
        page(entries(1, 4), entry(at, "ada", "gold", goldII), { total: 200, next: "n" }),
      );

      expect(placeIn().textContent).toContain(words);
      expect(placeIn().textContent).toContain("Gold II");
      expect(within(placeIn()).getByText("58 TP to Gold I")).toBeInTheDocument();
    });

    test("groups a Maniac's TP", async () => {
      const maniac = { tier: "maniac", tp: 1284, shielded: false } as const;

      await renderPage(
        { ...me, rank: maniac },
        page(entries(1, 4), entry(1, "ada", "maniac", maniac)),
      );

      expect(placeIn().textContent).toContain("1,284 TP");
    });

    test("asks a reader in Placement to finish it", async () => {
      await renderPage({ ...me, rank: { placementsLeft: 3 } }, page(entries(1, 4), null));

      expect(within(placeIn()).getByText("Finish your Placement")).toBeInTheDocument();
      expect(
        within(placeIn()).getByText("Your 5 Placement Duels get you on the Leaderboard."),
      ).toBeInTheDocument();
    });

    test("lays out the Tiers, their Divisions and the reader's", async () => {
      await renderPage(
        { ...me, rank: goldII },
        page(entries(1, 4), entry(128, "ada", "gold", goldII), { total: 200, next: "n" }),
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { Rank } from "ranked";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { RankedPage } from "@/pages/ranked-page";
import { useAuthStore } from "@/stores/auth-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlayStore } from "@/stores/play-store";

const userWith = (rank: Rank | null): Me => ({
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank,
  ornament: null,
  ornamentChoice: null,
});

const goldII: Rank = { tier: "gold", division: 2, tp: 42, shielded: false };

const rows = () => within(screen.getByRole("list", { name: "Tiers" })).getAllByRole("listitem");

const place = () => screen.getByRole("region", { name: "Ta place" });

const placeInEnglish = () => screen.getByRole("region", { name: "Where you stand" });

// The Divisions a row shows climbed.
const lit = (row: HTMLElement | undefined) =>
  row?.querySelectorAll("[data-division-tick][data-lit]").length;

// The page at `/ranked`, `/me` already read through Query, next to the play page it leads to.
const renderPage = async (user: Me | null) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  queryClient.setQueryData(meQueryOptions.queryKey, user);

  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()();

  const rankedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/ranked",
    component: RankedPage,
  });

  const playRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <h1>Jouer</h1>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([rankedRoute, playRoute]),
    history: createMemoryHistory({ initialEntries: ["/ranked"] }),
    context: { queryClient },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { level: 1, name: "Ranked" });
};

afterEach(() => {
  useAuthStore.setState(useAuthStore.getInitialState());
  usePlayStore.setState(usePlayStore.getInitialState());
});

describe("RankedPage", () => {
  test("lists the seven Tiers from Maniac down to Iron, with their figures", async () => {
    await renderPage(userWith(goldII));

    expect(screen.getByText("7 Tiers · 24 Divisions · 1 sommet")).toBeTruthy();
    expect(rows().map((row) => row.textContent)).toEqual([
      "07Maniac",
      "06Diamond",
      "05Platinum",
      "04Gold← toi",
      "03Silver",
      "02Bronze",
      "01Iron",
    ]);
  });

  test("marks the reader's Tier and lights the Divisions they have climbed", async () => {
    await renderPage(userWith(goldII));

    expect(rows().filter((row) => row.hasAttribute("aria-current"))).toEqual([rows()[3]]);
    expect(rows().map(lit)).toEqual([0, 0, 0, 3, 4, 4, 4]);
    expect(rows()[1]?.hasAttribute("data-ahead")).toBe(true);
    expect(rows()[4]?.hasAttribute("data-ahead")).toBe(false);
  });

  test("« Ta place »: the rank, its TP and what is left to the next", async () => {
    await renderPage(userWith(goldII));

    expect(within(place()).getByText("Gold II")).toBeTruthy();
    expect(within(place()).getByText("42 TP")).toBeTruthy();
    expect(within(place()).getByText("58 avant Gold I")).toBeTruthy();
    expect(within(place()).getByRole("meter", { name: "TP de la Division" })).toBeTruthy();
  });

  test("in Maniac, the TP alone, without a bar", async () => {
    await renderPage(userWith({ tier: "maniac", tp: 250, shielded: false }));

    expect(within(place()).getByText("Maniac")).toBeTruthy();
    expect(within(place()).getByText("250 TP")).toBeTruthy();
    expect(within(place()).queryByRole("meter")).toBeNull();
    expect(rows()[0]?.getAttribute("aria-current")).toBe("true");
  });

  test("in Placement, the Duels played, and no Tier is the reader's yet", async () => {
    await renderPage(userWith({ placementsLeft: 3 }));

    expect(within(place()).getByText("Placement")).toBeTruthy();
    expect(within(place()).getByText("2 / 5 Duels")).toBeTruthy();
    expect(within(place()).getByRole("meter", { name: "Placement" })).toBeTruthy();
    expect(rows().some((row) => row.hasAttribute("aria-current"))).toBe(false);
  });

  test("without a Rating, what gets the reader in", async () => {
    await renderPage(userWith(null));

    expect(within(place()).getByText("Non classé")).toBeTruthy();
    expect(within(place()).getByText("5 Duels de Placement")).toBeTruthy();
  });

  test("the rules of the Ranked, from the ranked package", async () => {
    await renderPage(userWith(goldII));

    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    const values = screen.getAllByRole("definition").map((value) => value.textContent);

    expect(terms).toEqual([
      "Placement",
      "Par Duel",
      "Une Division",
      "Sous 0 TP",
      "Changer de Tier",
    ]);
    expect(values).toEqual([
      "5 Duels",
      "8 à 35 TP",
      "100 TP",
      "75 TP, un cran plus bas",
      "1 Promotion Duel",
    ]);
  });

  test("« Jouer en Ranked » chooses the Duel and leads to the play page", async () => {
    await renderPage(userWith(goldII));

    fireEvent.click(screen.getByRole("link", { name: "Jouer en Ranked" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Jouer" })).toBeTruthy();
    expect(usePlayStore.getState().play).toBe("duel");
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("the Tiers, their figures and the reader's", async () => {
      await renderPage(userWith(goldII));

      expect(screen.getByRole("complementary", { name: "Your Ranked" })).toBeInTheDocument();
      expect(screen.getByText("7 Tiers · 24 Divisions · 1 summit")).toBeInTheDocument();
      expect(
        within(screen.getByRole("list", { name: "Tiers" })).getAllByRole("listitem")[3],
      ).toHaveTextContent("04Gold← you");
    });

    test("where the reader stands: the rank, its TP and what is left, read by the meter", async () => {
      await renderPage(userWith(goldII));

      expect(within(placeInEnglish()).getByText("Gold II")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByText("42 TP")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByText("58 to Gold I")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByRole("meter", { name: "Division TP" })).toHaveAttribute(
        "aria-valuetext",
        "42 TP out of 100 · 58 to Gold I",
      );
    });

    test("in Maniac, the TP grouped the English way, without a ceiling", async () => {
      await renderPage(userWith({ tier: "maniac", tp: 1284, shielded: false }));

      expect(within(placeInEnglish()).getByText("1,284 TP")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByText("no ceiling")).toBeInTheDocument();
    });

    test("in Placement, the Duels played", async () => {
      await renderPage(userWith({ placementsLeft: 3 }));

      expect(within(placeInEnglish()).getByText("2 / 5 Duels")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByText("then your rank")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByRole("meter", { name: "Placement" })).toHaveAttribute(
        "aria-valuetext",
        "2 of 5 Placement Duels played",
      );
    });

    test("without a Rating, what gets the reader in", async () => {
      await renderPage(userWith(null));

      expect(within(placeInEnglish()).getByText("Unranked")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByText("5 Placement Duels")).toBeInTheDocument();
      expect(within(placeInEnglish()).getByText("to get ranked")).toBeInTheDocument();
    });

    test("the rules of the Ranked, and the way to play it", async () => {
      await renderPage(userWith(goldII));

      expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
        "Placement",
        "Per Duel",
        "One Division",
        "Below 0 TP",
        "Changing Tier",
      ]);
      expect(screen.getAllByRole("definition").map((value) => value.textContent)).toEqual([
        "5 Duels",
        "8 to 35 TP",
        "100 TP",
        "75 TP, one step down",
        "1 Promotion Duel",
      ]);
      expect(screen.getByRole("link", { name: "Play Ranked" })).toBeInTheDocument();
    });
  });

  test("a Visitor sees the Tiers, and is asked to sign in to play", async () => {
    await renderPage(null);

    expect(rows()).toHaveLength(7);
    expect(within(place()).getByText("Non classé")).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "Jouer en Ranked" }));

    expect(useAuthStore.getState().signInOpen).toBe(true);
    expect(usePlayStore.getState().play).toBe("solo");
    expect(screen.getByRole("heading", { level: 1, name: "Ranked" })).toBeTruthy();
  });
});

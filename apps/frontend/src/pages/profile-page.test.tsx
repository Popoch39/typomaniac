import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Rank } from "ranked";
import { Suspense } from "react";
import { describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import {
  PROGRESSION_WINDOWS,
  type Profile,
  type ProgressionWindow,
  profileQueryOptions,
} from "@/api/profile";
import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import type { AuraRuntime } from "@/lib/aura-runtime";
import { ProfilePage } from "@/pages/profile-page";
import { fakeAuraRuntime } from "@/test/fake-aura-runtime";

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

const orII: Rank = { tier: "or", division: 2, tp: 42, shielded: false };

const profile = (stats: Partial<Profile["stats"]>): Profile => ({
  handle: "ada",
  image: null,
  rank: null,
  ornament: null,
  stats: {
    duels: 0,
    record: { wins: 0, losses: 0, draws: 0 },
    averages: { wpm: null, accuracy: null },
    records: { wpm: null, score: null, combo: null },
    progression: [],
    ...stats,
  },
});

const isProgressionWindow = (value: string): value is ProgressionWindow =>
  PROGRESSION_WINDOWS.some((window) => window === value);

// `count` Duels of the Progression, one a minute.
const points = (count: number): Profile["stats"]["progression"] =>
  Array.from({ length: count }, (_, index) => ({
    endedAt: Date.UTC(2026, 8, 25, 9, index),
    wpm: 60 + index,
    raw: 70 + index,
    accuracy: 95,
    consistency: 80,
  }));

type RenderOptions = {
  windows?: Partial<Record<ProgressionWindow, Profile>>;
  auraRuntime?: AuraRuntime;
};

// The page with the User and their Profile in the cache, the way the route's loader leaves them.
const renderPage = async (
  user: Me,
  own: Profile | null,
  { windows = {}, auraRuntime = fakeAuraRuntime().runtime }: RenderOptions = {},
) => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, user);

  if (own !== null) {
    queryClient.setQueryData(profileQueryOptions(own.handle).queryKey, own);
  }

  for (const [window, cached] of Object.entries(windows)) {
    if (isProgressionWindow(window)) {
      queryClient.setQueryData(profileQueryOptions(cached.handle, window).queryKey, cached);
    }
  }

  const router = createRouter({
    routeTree: createRootRoute({ component: ProfilePage }),
    history: createMemoryHistory({ initialEntries: ["/profile"] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <AuraRuntimeContext value={auraRuntime}>
        <Suspense>
          <RouterProvider router={router} />
        </Suspense>
      </AuraRuntimeContext>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { level: 1 });
};

// The hero, named by its title: the User's Handle.
const hero = () => screen.getByRole("region", { name: "@ada" });

// The terms of the Stats' tiles, in their order on the grid.
const tileTerms = () =>
  within(screen.getByLabelText("Stats"))
    .getAllByRole("term")
    .map((term) => term.textContent);

const tile = (term: string) => {
  const found = within(screen.getByLabelText("Stats")).getByText(term).closest("div");

  if (found === null) {
    throw new Error(`No tile ${term}`);
  }

  return found;
};

describe("ProfilePage", () => {
  describe("the hero", () => {
    test("names the User by their Handle, as the others see them", async () => {
      await renderPage(me, profile({}));

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("@ada");
      expect(within(hero()).getByText("Les autres te voient en @ada.")).toBeInTheDocument();
    });

    test("links to the User's public Profile", async () => {
      await renderPage(me, profile({}));

      expect(within(hero()).getByRole("button", { name: "Profile public" })).toHaveAttribute(
        "href",
        "/u/ada",
      );
    });

    test("shows the User's rank, its TP, how far the next and its bar", async () => {
      await renderPage({ ...me, rank: orII }, profile({}));

      expect(hero().textContent).toContain("Or II");
      expect(within(hero()).getByText("42 TP · 58 avant Or I")).toBeInTheDocument();
      expect(within(hero()).getByRole("meter", { name: "TP de la Division" })).toHaveAttribute(
        "value",
        "42",
      );
      // The rank stands out in its Blason: the Emblem of Or on its Ornament.
      expect(
        hero().querySelector('[data-tier-blason] use[href="#tier-ornament-or"]'),
      ).not.toBeNull();
    });

    test("a Maniac has their TP and no bar, the Maniac has no ceiling", async () => {
      await renderPage({ ...me, rank: { tier: "maniac", tp: 250, shielded: false } }, profile({}));

      expect(hero().textContent).toContain("Maniac");
      expect(within(hero()).getByText("250 TP")).toBeInTheDocument();
      expect(within(hero()).queryByRole("meter")).not.toBeInTheDocument();
    });

    test("in Placement, the Placement Duels played, one notch each", async () => {
      await renderPage({ ...me, rank: { placementsLeft: 3 } }, profile({}));

      expect(within(hero()).getByText("Placement")).toBeInTheDocument();
      expect(within(hero()).getByText("2 / 5 Duels")).toBeInTheDocument();
      expect(within(hero()).getByRole("meter", { name: "Placement" })).toHaveAttribute(
        "value",
        "2",
      );
      expect(hero().querySelector("[data-tier-blason]")).toBeNull();
    });

    test("without a Rating, neither a rank nor a bar", async () => {
      await renderPage(me, profile({}));

      expect(within(hero()).queryByRole("meter")).not.toBeInTheDocument();
      expect(hero().querySelector("[data-tier-blason]")).toBeNull();
    });

    test("the avatar wears the User's Ornament and gives off its full Aura", async () => {
      const browser = fakeAuraRuntime();

      await renderPage({ ...me, rank: orII, ornament: "or" }, profile({}), {
        auraRuntime: browser.runtime,
      });

      await waitFor(() => expect(browser.painters).toHaveLength(1));

      expect(browser.painters[0]?.tier).toBe("or");
      expect(browser.painters[0]?.canvas.closest("[data-ornament]")).not.toBeNull();
    });
  });

  test("shows the User's Stats on one grid of 10 tiles", async () => {
    await renderPage(
      me,
      profile({
        duels: 4,
        record: { wins: 2, losses: 1, draws: 1 },
        averages: { wpm: 62.4, accuracy: 96.6 },
        records: { wpm: 90, score: 1234, combo: null },
      }),
    );

    expect(screen.getByRole("heading", { level: 2, name: "Stats" })).toBeInTheDocument();
    expect(tileTerms()).toEqual([
      "victoires",
      "défaites",
      "Draws",
      "taux de victoire",
      "Duels",
      "wpm moyen",
      "meilleur wpm",
      "accuracy moyenne",
      "meilleur Score",
      "meilleur Combo",
    ]);
    expect(tile("victoires")).toHaveTextContent("2");
    expect(tile("défaites")).toHaveTextContent("1");
    expect(tile("Draws")).toHaveTextContent("1");
    expect(tile("taux de victoire")).toHaveTextContent("50 %");
    expect(tile("Duels")).toHaveTextContent("4");
    expect(tile("wpm moyen")).toHaveTextContent("62");
    expect(tile("meilleur wpm")).toHaveTextContent("90");
    expect(tile("accuracy moyenne")).toHaveTextContent("97 %");
    expect(tile("meilleur Score")).toHaveTextContent("1 234");
    expect(tile("meilleur Combo")).toHaveTextContent("–");
  });

  test("shows the four curves of the Progression on one card, with the Duels there are", async () => {
    await renderPage(me, profile({ duels: 3, progression: points(3) }));

    const progression = screen.getByRole("region", { name: "Progression" });

    for (const metric of ["wpm", "raw", "accuracy", "consistency"]) {
      expect(
        within(progression).getByRole("figure", { name: `Progression ${metric}` }),
      ).toBeInTheDocument();
    }

    expect(within(progression).getByText("3 Duels, hors Forfeits")).toBeInTheDocument();
    expect(within(progression).getByRole("button", { name: "50 derniers" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("another window reloads the Progression, never the tiles", async () => {
    const tiles = { duels: 250, record: { wins: 250, losses: 0, draws: 0 } };

    await renderPage(me, profile({ ...tiles, progression: points(50) }), {
      windows: {
        "200": profile({ ...tiles, duels: 999, progression: points(200) }),
        all: profile({ ...tiles, duels: 999, progression: points(240) }),
      },
    });

    await userEvent.click(screen.getByRole("button", { name: "200 derniers" }));

    expect(await screen.findByText("200 Duels, hors Forfeits")).toBeInTheDocument();
    expect(tile("Duels")).toHaveTextContent("250");

    await userEvent.click(screen.getByRole("button", { name: "tous" }));

    expect(await screen.findByText("240 Duels, hors Forfeits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tous" })).toHaveAttribute("aria-pressed", "true");
    expect(tile("Duels")).toHaveTextContent("250");
  });

  test("invites a User without a Duel to play", async () => {
    await renderPage(me, profile({}));

    expect(screen.getByText(/ton premier Duel/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lancer un Duel" })).toHaveAttribute("href", "/");
    expect(screen.queryByLabelText("Stats")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Progression" })).not.toBeInTheDocument();
  });

  describe("the settings column", () => {
    test("changes the Handle, and says what changing it does", async () => {
      await renderPage(me, profile({}));

      expect(screen.getByRole("textbox", { name: "Handle" })).toHaveValue("ada");
      expect(screen.getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
      expect(screen.getByText(/Changer de Handle libère l'ancien aussitôt/)).toBeInTheDocument();
    });

    test("chooses the Ornament among the 9, the Tiers above the User's locked", async () => {
      await renderPage(
        { ...me, rank: orII, ornament: "or", ornamentChoice: "follow" },
        profile({}),
      );

      const picker = screen.getByRole("group", { name: "Ornament" });

      expect(within(picker).getAllByRole("radio")).toHaveLength(9);
      expect(within(picker).getByRole("radio", { name: "Suivre mon Tier" })).toBeChecked();

      for (const name of ["Suivre mon Tier", "Aucun", "Fer", "Bronze", "Argent", "Or"]) {
        expect(within(picker).getByRole("radio", { name })).toBeEnabled();
      }

      for (const name of ["Platine", "Diamant", "Maniac"]) {
        expect(within(picker).getByRole("radio", { name })).toBeDisabled();
      }

      expect(picker).toHaveAccessibleDescription(
        "Ceux des Tiers au-dessus du tien se débloquent en y montant.",
      );
    });

    test("a Maniac may wear every Ornament: nothing is locked, nothing to say", async () => {
      await renderPage(
        {
          ...me,
          rank: { tier: "maniac", tp: 250, shielded: false },
          ornament: "maniac",
          ornamentChoice: "follow",
        },
        profile({}),
      );

      const picker = screen.getByRole("group", { name: "Ornament" });

      for (const radio of within(picker).getAllByRole("radio")) {
        expect(radio).toBeEnabled();
      }

      expect(picker).not.toHaveAttribute("aria-describedby");
    });

    test("in Placement, every Ornament is locked until the Placement ends", async () => {
      await renderPage(
        { ...me, rank: { placementsLeft: 3 }, ornamentChoice: "follow" },
        profile({}),
      );

      const picker = screen.getByRole("group", { name: "Ornament" });

      expect(picker).toHaveAccessibleDescription("Termine ton Placement");

      for (const radio of within(picker).getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
    });
  });

  test("a User without a Handle is asked for one, and has neither Stats nor Ornament", async () => {
    await renderPage({ ...me, handle: null }, null);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ada");
    expect(
      screen.getByText("Tu n'as pas encore de Handle : sans lui, pas de Duel."),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Handle" })).toHaveValue("ada");
    expect(screen.queryByRole("button", { name: "Profile public" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Stats" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Ornament" })).not.toBeInTheDocument();
  });
});

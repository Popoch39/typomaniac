import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import userEvent from "@testing-library/user-event";

import {
  PROGRESSION_WINDOWS,
  type Profile,
  type ProgressionWindow,
  profileQueryOptions,
} from "@/api/profile";
import { ProfilePage } from "@/pages/profile-page";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
};

const profile = (stats: Partial<Profile["stats"]>): Profile => ({
  handle: "ada",
  image: null,
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

// The page with the User and their Profile in the cache, the way the route's loader leaves them.
const renderPage = async (
  user: Me,
  own: Profile | null,
  windows: Partial<Record<ProgressionWindow, Profile>> = {},
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
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>,
  );

  await screen.findByRole("heading", { name: "Profil" });
};

const tile = (list: string, term: string) => {
  const found = within(screen.getByLabelText(list)).getByText(term).closest("div");

  if (found === null) {
    throw new Error(`No tile ${term}`);
  }

  return found;
};

describe("ProfilePage", () => {
  test("shows the User's Stats: their tiles and their record", async () => {
    await renderPage(
      me,
      profile({
        duels: 4,
        record: { wins: 2, losses: 1, draws: 1 },
        averages: { wpm: 62.4, accuracy: 96.6 },
        records: { wpm: 90, score: 1234, combo: null },
      }),
    );

    expect(tile("Stats", "Duels")).toHaveTextContent("4");
    expect(tile("Stats", "wpm moyen")).toHaveTextContent("62");
    expect(tile("Stats", "meilleur wpm")).toHaveTextContent("90");
    expect(tile("Stats", "accuracy moyenne")).toHaveTextContent("97 %");
    expect(tile("Stats", "meilleur Score")).toHaveTextContent("1234");
    expect(tile("Stats", "meilleur Combo")).toHaveTextContent("–");
    expect(tile("Bilan", "victoires")).toHaveTextContent("2");
    expect(tile("Bilan", "défaites")).toHaveTextContent("1");
    expect(tile("Bilan", "Draws")).toHaveTextContent("1");
    expect(tile("Bilan", "taux de victoire")).toHaveTextContent("50 %");
  });

  test("shows the four curves of the Progression, with the Duels there are", async () => {
    await renderPage(me, profile({ duels: 3, progression: points(3) }));

    for (const metric of ["wpm", "raw", "accuracy", "consistency"]) {
      expect(screen.getByRole("figure", { name: `Progression ${metric}` })).toBeInTheDocument();
    }

    expect(screen.getByText("3 Duels, hors Forfeits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "50 derniers" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("another window reloads the Progression, never the tiles", async () => {
    const tiles = { duels: 250, record: { wins: 250, losses: 0, draws: 0 } };

    await renderPage(me, profile({ ...tiles, progression: points(50) }), {
      "200": profile({ ...tiles, duels: 999, progression: points(200) }),
      all: profile({ ...tiles, duels: 999, progression: points(240) }),
    });

    await userEvent.click(screen.getByRole("button", { name: "200 derniers" }));

    expect(await screen.findByText("200 Duels, hors Forfeits")).toBeInTheDocument();
    expect(tile("Stats", "Duels")).toHaveTextContent("250");

    await userEvent.click(screen.getByRole("button", { name: "tous" }));

    expect(await screen.findByText("240 Duels, hors Forfeits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tous" })).toHaveAttribute("aria-pressed", "true");
    expect(tile("Stats", "Duels")).toHaveTextContent("250");
  });

  test("invites a User without a Duel to play", async () => {
    await renderPage(me, profile({}));

    expect(screen.getByText(/ton premier Duel/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lancer un Duel" })).toHaveAttribute("href", "/");
    expect(screen.queryByLabelText("Stats")).not.toBeInTheDocument();
  });

  test("a User without a Handle has no Stats", async () => {
    await renderPage({ ...me, handle: null }, null);

    expect(screen.queryByRole("heading", { name: "Stats" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Voir mon Profile public" })).not.toBeInTheDocument();
  });

  test("links to the User's public Profile", async () => {
    await renderPage(me, profile({}));

    expect(screen.getByRole("link", { name: "Voir mon Profile public" })).toHaveAttribute(
      "href",
      "/u/ada",
    );
  });
});

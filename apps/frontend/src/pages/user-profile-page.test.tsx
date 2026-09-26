import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  notFound,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { type Profile, profileQueryOptions } from "@/api/profile";
import { UserProfileNotFoundPage } from "@/pages/user-profile-not-found-page";
import { UserProfilePage } from "@/pages/user-profile-page";

const me: Me = {
  id: "ada-id",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  handle: "ada",
  rank: null,
  ornament: null,
};

const grace: Profile = {
  handle: "grace",
  image: null,
  rank: null,
  ornament: null,
  stats: {
    duels: 3,
    record: { wins: 2, losses: 1, draws: 0 },
    averages: { wpm: 71.2, accuracy: 97 },
    records: { wpm: 88, score: 900, combo: 40 },
    progression: [],
  },
};

// The page at `/u/<handle>`, loaded the way the real route loads it: the Profile read through
// Query from `profiles`, the not-found page for a Handle nobody holds.
const renderAt = async (user: Me | null, handle: string, profiles: Profile[]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  queryClient.setQueryData(meQueryOptions.queryKey, user);

  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()();

  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/u/$handle",
    loader: async ({ params }) => {
      if (user === null) {
        return;
      }

      const found = profiles.find((profile) => profile.handle === params.handle.toLowerCase());

      if (found === undefined) {
        throw notFound();
      }

      queryClient.setQueryData(profileQueryOptions(params.handle).queryKey, found);
    },
    component: UserProfilePage,
    notFoundComponent: UserProfileNotFoundPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([profileRoute]),
    history: createMemoryHistory({ initialEntries: [`/u/${handle}`] }),
    context: { queryClient },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe("UserProfilePage", () => {
  test("shows another User's Handle and Stats, and nothing of their Duels", async () => {
    await renderAt(me, "grace", [grace]);

    expect(await screen.findByRole("heading", { name: "@grace" })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Stats")).getByText("Duels").closest("div"),
    ).toHaveTextContent("3");
    expect(
      within(screen.getByLabelText("Bilan")).getByText("victoires").closest("div"),
    ).toHaveTextContent("2");
    expect(screen.queryByRole("link", { name: /Revoir/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Duel history/)).not.toBeInTheDocument();
  });

  test("shows the User's Tier, Division and TP", async () => {
    await renderAt(me, "grace", [
      { ...grace, rank: { tier: "or", division: 2, tp: 42, shielded: false } },
    ]);

    expect(await screen.findByText("Or II · 42 TP")).toBeInTheDocument();
    // The rank stands out in its Blason: the Emblem of Or on its Ornament.
    expect(
      document.querySelector('[data-tier-blason] use[href="#tier-ornament-or"]'),
    ).not.toBeNull();
  });

  test("the User's avatar wears their Ornament", async () => {
    await renderAt(me, "grace", [
      { ...grace, rank: { tier: "or", division: 2, tp: 42, shielded: false }, ornament: "or" },
    ]);

    await screen.findByText("Or II · 42 TP");

    expect(document.querySelector('[data-ornament] use[href="#tier-ornament-or"]')).not.toBeNull();
  });

  test("an avatar without an Ornament wears none", async () => {
    await renderAt(me, "grace", [grace]);

    await screen.findByRole("heading", { name: "@grace" });

    expect(document.querySelector("[data-ornament]")).toBeNull();
  });

  test("shows the Placement Duels a User has left", async () => {
    await renderAt(me, "grace", [{ ...grace, rank: { placementsLeft: 4 } }]);

    expect(await screen.findByText("Placement · 4 Duels restants")).toBeInTheDocument();
    expect(document.querySelector("[data-tier-blason]")).toBeNull();
  });

  test("a Handle has no case: /u/Grace shows @grace", async () => {
    await renderAt(me, "Grace", [grace]);

    expect(await screen.findByRole("heading", { name: "@grace" })).toBeInTheDocument();
  });

  test("a User without a Duel yet has no Stats", async () => {
    await renderAt(me, "grace", [{ ...grace, stats: { ...grace.stats, duels: 0 } }]);

    expect(await screen.findByText("Pas encore de Duel")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lancer un Duel" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Stats")).not.toBeInTheDocument();
  });

  test("an unknown Handle leads to a not-found page", async () => {
    await renderAt(me, "nobody", [grace]);

    expect(await screen.findByRole("heading", { name: "User introuvable" })).toBeInTheDocument();
  });

  test("a Visitor is invited to sign in instead", async () => {
    await renderAt(null, "grace", [grace]);

    expect(await screen.findByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "@grace" })).not.toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  notFound,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ORNAMENT_CHOICES, type OrnamentChoice, type Rank } from "ranked";
import { afterEach, describe, expect, test, vi } from "vitest";

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
  ornamentChoice: null,
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

  return queryClient;
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

  describe("the Ornament picker", () => {
    const orII: Rank = { tier: "or", division: 2, tp: 42, shielded: false };
    const rankedMe: Me = { ...me, rank: orII, ornament: "or", ornamentChoice: "follow" };
    const ada: Profile = { ...grace, handle: "ada", rank: orII, ornament: "or" };

    // Each body the picker may send, by the choice it carries.
    const choiceOfBody = new Map(
      ORNAMENT_CHOICES.map((choice) => [JSON.stringify({ choice }), choice]),
    );

    // The API as it answers the choice: the User wearing what they chose.
    const stubSave = (answer: (choice: OrnamentChoice | null) => Me) => {
      const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const choice = choiceOfBody.get(String(init?.body)) ?? null;

        return new Response(JSON.stringify(answer(choice)), {
          headers: { "content-type": "application/json" },
        });
      });

      vi.stubGlobal("fetch", fetch);

      return fetch;
    };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test("is on the User's own Profile only", async () => {
      await renderAt(rankedMe, "ada", [ada, grace]);

      const picker = await screen.findByRole("group", { name: "Ornament" });

      expect(screen.getByRole("radio", { name: "Suivre mon Tier" })).toBeChecked();
      expect(
        within(picker)
          .getAllByRole("radio")
          .map((radio) => radio.closest("label")?.textContent),
      ).toEqual([
        "Suivre mon Tier",
        "Aucun",
        "Fer",
        "Bronze",
        "Argent",
        "Or",
        "Platine",
        "Diamant",
        "Maniac",
      ]);
    });

    test("is not on another User's Profile", async () => {
      await renderAt(rankedMe, "grace", [ada, grace]);

      await screen.findByRole("heading", { name: "@grace" });

      expect(screen.queryByRole("group", { name: "Ornament" })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    });

    test("locks the Ornaments above the User's Tier", async () => {
      await renderAt(rankedMe, "ada", [ada]);

      await screen.findByRole("group", { name: "Ornament" });

      for (const name of ["Suivre mon Tier", "Aucun", "Fer", "Bronze", "Argent", "Or"]) {
        expect(screen.getByRole("radio", { name })).toBeEnabled();
      }

      for (const name of ["Platine", "Diamant", "Maniac"]) {
        expect(screen.getByRole("radio", { name })).toBeDisabled();
      }
    });

    test.each([
      ["in Placement", { placementsLeft: 3 }, "follow"],
      ["without a Rating", null, null],
    ] as const)("locks every Ornament %s", async (_when, rank, ornamentChoice) => {
      await renderAt({ ...me, rank, ornamentChoice }, "ada", [{ ...ada, rank, ornament: null }]);

      expect(await screen.findByRole("group", { name: "Ornament" })).toHaveAccessibleDescription(
        "Termine ton Placement",
      );

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
    });

    test("applies the choice to the avatar at once", async () => {
      const fetch = stubSave((choice) => ({
        ...rankedMe,
        ornament: "bronze",
        ornamentChoice: choice,
      }));

      const user = userEvent.setup();

      const queryClient = await renderAt(rankedMe, "ada", [ada]);

      await user.click(await screen.findByRole("radio", { name: "Bronze" }));

      await waitFor(() => {
        expect(screen.getByRole("radio", { name: "Bronze" })).toBeChecked();
      });
      expect(
        document.querySelector('[data-ornament] use[href="#tier-ornament-bronze"]'),
      ).not.toBeNull();
      // The header's avatar reads the signed-in User: it wears the new Ornament too.
      expect(queryClient.getQueryData(meQueryOptions.queryKey)?.ornament).toBe("bronze");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/api\/me\/ornament$/);
    });

    test("moves the choice with the arrow keys, skipping the locked Ornaments", async () => {
      const fetch = stubSave((choice) => ({ ...rankedMe, ornament: null, ornamentChoice: choice }));
      const user = userEvent.setup();

      await renderAt({ ...rankedMe, ornamentChoice: "or" }, "ada", [ada]);
      await screen.findByRole("group", { name: "Ornament" });

      await user.tab();

      expect(screen.getByRole("radio", { name: "Or" })).toHaveFocus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("radio", { name: "Suivre mon Tier" })).toHaveFocus();

      await user.keyboard("{ArrowLeft}{ArrowLeft}");

      expect(screen.getByRole("radio", { name: "Argent" })).toHaveFocus();
      await waitFor(() => {
        expect(screen.getByRole("radio", { name: "Argent" })).toBeChecked();
      });
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  test("a Visitor is invited to sign in instead", async () => {
    await renderAt(null, "grace", [grace]);

    expect(await screen.findByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "@grace" })).not.toBeInTheDocument();
  });
});

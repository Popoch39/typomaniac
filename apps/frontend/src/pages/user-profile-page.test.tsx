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
import { beforeEach, describe, expect, test } from "vitest";

import { type Me, meQueryOptions } from "@/api/me";
import { type Profile, profileQueryOptions } from "@/api/profile";
import { AuraRuntimeContext } from "@/components/aura/aura-runtime-context";
import type { AuraRuntime } from "@/lib/aura-runtime";
import { fakeAuraRuntime } from "@/test/fake-aura-runtime";
import { UserProfileNotFoundPage } from "@/pages/user-profile-not-found-page";
import { UserProfilePage } from "@/pages/user-profile-page";
import { UserProfilePendingPage } from "@/pages/user-profile-pending-page";
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
const renderAt = async (
  user: Me | null,
  handle: string,
  profiles: Profile[],
  auraRuntime: AuraRuntime = fakeAuraRuntime().runtime,
) => {
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
      <AuraRuntimeContext value={auraRuntime}>
        <RouterProvider router={router} />
      </AuraRuntimeContext>
    </QueryClientProvider>,
  );

  return queryClient;
};

// The value a term of the card named `card` gives.
const valueOf = (card: string, term: string) =>
  within(screen.getByRole("region", { name: card })).getByText(term, { selector: "dt" })
    .nextElementSibling?.textContent;

describe("UserProfilePage", () => {
  test("shows another User's Handle and Stats, and nothing of their Duels", async () => {
    await renderAt(me, "grace", [grace]);

    const header = await screen.findByRole("region", { name: "@grace" });

    expect(within(header).getByRole("heading", { level: 1 })).toHaveTextContent("@grace");
    expect(within(header).getByText("3 Duels")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "wpm moyen" })).getByText("71")).toBeVisible();
    expect(valueOf("taux de victoire", "victoires")).toBe("2");
    expect(valueOf("Records", "meilleur Combo")).toBe("40");
    expect(screen.queryByRole("link", { name: /Revoir/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Duel history/)).not.toBeInTheDocument();
  });

  test("shows the User's Tier, Division and TP", async () => {
    await renderAt(me, "grace", [
      { ...grace, rank: { tier: "gold", division: 2, tp: 42, shielded: false } },
    ]);

    expect(await screen.findByText("Gold II")).toBeInTheDocument();
    expect(screen.getByText("42/100 TP")).toBeInTheDocument();
    expect(screen.getByText("58 TP avant Gold I")).toBeInTheDocument();
    // Before it, the Emblem of Gold.
    expect(
      document.querySelector('[data-tier-emblem] use[href="#tier-emblem-gold"]'),
    ).not.toBeNull();
    // Under it, its progress: the Division's TP out of 100.
    expect(screen.getByRole("meter", { name: "TP de la Division" })).toHaveAttribute("value", "42");
  });

  test("the User's avatar wears their Ornament", async () => {
    await renderAt(me, "grace", [
      { ...grace, rank: { tier: "gold", division: 2, tp: 42, shielded: false }, ornament: "gold" },
    ]);

    await screen.findByText("Gold II");

    expect(
      document.querySelector('[data-ornament] use[href="#tier-ornament-gold"]'),
    ).not.toBeNull();
  });

  test.each([
    ["Gold", "gold"],
    ["Platinum", "platinum"],
    ["Diamond", "diamond"],
  ] as const)("the avatar of a %s User gives off its full Aura", async (name, tier) => {
    const browser = fakeAuraRuntime();

    await renderAt(
      me,
      "grace",
      [{ ...grace, rank: { tier, division: 2, tp: 42, shielded: false }, ornament: tier }],
      browser.runtime,
    );

    await screen.findByText(`${name} II`);
    await waitFor(() => expect(browser.painters).toHaveLength(1));

    expect(browser.painters[0]?.tier).toBe(tier);
    expect(browser.painters[0]?.canvas.closest("[data-ornament]")).not.toBeNull();
  });

  test("the avatar of a Maniac User gives off its full Aura", async () => {
    const browser = fakeAuraRuntime();

    await renderAt(
      me,
      "grace",
      [{ ...grace, rank: { tier: "maniac", tp: 42, shielded: false }, ornament: "maniac" }],
      browser.runtime,
    );

    await screen.findByText("Maniac");

    expect(screen.getByText("42 TP")).toBeInTheDocument();
    await waitFor(() => expect(browser.painters).toHaveLength(1));

    const ornament = browser.painters[0]?.canvas.closest("[data-ornament]");

    expect(browser.painters[0]?.tier).toBe("maniac");
    // The fire takes the place of the avatar's rays.
    expect(ornament?.querySelector("[data-ornament-rays]")).toBeNull();
  });

  test("an avatar without an Ornament wears none", async () => {
    await renderAt(me, "grace", [grace]);

    await screen.findByRole("heading", { name: "@grace" });

    expect(document.querySelector("[data-ornament]")).toBeNull();
  });

  test("shows the Placement Duels a User has played", async () => {
    await renderAt(me, "grace", [{ ...grace, rank: { placementsLeft: 4 } }]);

    expect(await screen.findByText("Placement")).toBeInTheDocument();
    expect(screen.getByText("1 / 5 Duels")).toBeInTheDocument();
    expect(document.querySelector("[data-tier-emblem]")).toBeNull();
    expect(screen.getByRole("meter", { name: "Placement" })).toHaveAttribute("value", "1");
  });

  test("a Handle has no case: /u/Grace shows @grace", async () => {
    await renderAt(me, "Grace", [grace]);

    expect(await screen.findByRole("heading", { name: "@grace" })).toBeInTheDocument();
  });

  test("a User without a Duel yet has no Stats", async () => {
    await renderAt(me, "grace", [{ ...grace, stats: { ...grace.stats, duels: 0 } }]);

    expect(await screen.findByText("Pas encore de Duel")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lancer un Duel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "wpm moyen" })).not.toBeInTheDocument();
    expect(screen.getByText("0 Duel")).toBeInTheDocument();
  });

  test("an unknown Handle leads to a not-found page", async () => {
    await renderAt(me, "nobody", [grace]);

    expect(await screen.findByRole("heading", { name: "User introuvable" })).toBeInTheDocument();
  });

  test("has no settings, not even on the User's own Profile: they are on `/profile`", async () => {
    await renderAt({ ...me, ornamentChoice: "follow" }, "ada", [{ ...grace, handle: "ada" }]);

    await screen.findByRole("heading", { name: "@ada" });

    expect(screen.queryByRole("group", { name: "Ornament" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Modifier le profil" })).not.toBeInTheDocument();
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("another User's Stats", async () => {
      await renderAt(me, "grace", [grace]);

      await screen.findByRole("heading", { name: "@grace" });

      expect(screen.getByText("3 Duels")).toBeInTheDocument();
      expect(valueOf("win rate", "wins")).toBe("2");
      expect(valueOf("Records", "best Score")).toBe("900");
    });

    test("a User without a Duel yet has no Stats", async () => {
      await renderAt(me, "grace", [{ ...grace, stats: { ...grace.stats, duels: 0 } }]);

      expect(await screen.findByText("No Duels yet")).toBeInTheDocument();
      expect(
        screen.getByText("Their Stats will show up after their first finished Duel."),
      ).toBeInTheDocument();
    });

    test("an unknown Handle: what happened, what it costs, and a way out", async () => {
      await renderAt(me, "nobody", [grace]);

      expect(await screen.findByRole("heading", { name: "User not found" })).toBeInTheDocument();
      expect(
        screen.getByText(
          "No User has this Handle: it was never taken, or its owner has since changed it.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Find a User" })).toHaveAttribute(
        "href",
        "/friends",
      );
    });

    test("while the Profile loads, each part says what it loads", () => {
      render(<UserProfilePendingPage />);

      for (const name of ["Loading Profile", "Loading Stats"]) {
        expect(screen.getByRole("status", { name })).toBeInTheDocument();
      }
    });

    test("a Visitor is invited to sign in", async () => {
      await renderAt(null, "grace", [grace]);

      expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
      expect(screen.getByText("Sign in to see this User's Profile.")).toBeInTheDocument();
    });
  });

  test("a Visitor is invited to sign in instead", async () => {
    await renderAt(null, "grace", [grace]);

    expect(await screen.findByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "@grace" })).not.toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ORNAMENT_CHOICES, type OrnamentChoice, type Rank } from "ranked";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

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
import { useLocaleStore } from "@/stores/locale-store";
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
  place: null,
};

const goldII: Rank = { tier: "gold", division: 2, tp: 42, shielded: false };

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

// The Duels of the Progression, one a minute, at these wpm.
const points = (wpms: readonly number[]): Profile["stats"]["progression"] =>
  wpms.map((wpm, index) => ({
    endedAt: Date.UTC(2026, 8, 25, 9, index),
    wpm,
    raw: wpm + 10,
    accuracy: 95,
    consistency: 80,
  }));

// `count` Duels at `wpm`.
const steady = (count: number, wpm: number) => Array.from({ length: count }, () => wpm);

const played = {
  duels: 4,
  record: { wins: 2, losses: 1, draws: 1 },
  averages: { wpm: 62.4, accuracy: 96.6 },
  records: { wpm: 90, score: 1234, combo: null },
  progression: points([60, 62, 61]),
};

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

  return queryClient;
};

// The header, named by its title: the User's Handle.
const hero = () => screen.getByRole("region", { name: "@ada" });

const card = (name: string) => screen.getByRole("region", { name });

// The value a term of `list` gives.
const valueOf = (list: HTMLElement, term: string) =>
  within(list).getByText(term, { selector: "dt" }).nextElementSibling?.textContent;

// The settings, behind « Modifier le profil ».
const openSettings = async (name = "Modifier le profil", header = "@ada") => {
  await userEvent.click(
    within(screen.getByRole("region", { name: header })).getByRole("button", { name }),
  );

  return screen.findByRole("dialog", { name });
};

describe("ProfilePage", () => {
  describe("the header", () => {
    test("names the User by their Handle, with the Duels they played", async () => {
      await renderPage(me, profile(played));

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("@ada");
      expect(within(hero()).getByText("4 Duels")).toBeInTheDocument();
    });

    test("one Duel is one", async () => {
      await renderPage(me, profile({ ...played, duels: 1 }));

      expect(within(hero()).getByText("1 Duel")).toBeInTheDocument();
    });

    test("no longer links to the public Profile", async () => {
      await renderPage(me, profile(played));

      expect(within(hero()).queryByRole("link")).not.toBeInTheDocument();
    });

    test("shows the User's rank once: its Emblem, its TP out of 100, how far the next, its bar", async () => {
      await renderPage({ ...me, rank: goldII }, profile(played));

      expect(within(hero()).getByText("Gold II")).toBeInTheDocument();
      expect(within(hero()).getByText("42/100 TP")).toBeInTheDocument();
      expect(within(hero()).getByText("58 TP avant Gold I")).toBeInTheDocument();
      expect(within(hero()).getByRole("meter", { name: "TP de la Division" })).toHaveAttribute(
        "value",
        "42",
      );
      expect(hero().querySelector('[data-tier-emblem] use[href="#tier-emblem-gold"]')).not.toBe(
        null,
      );
      expect(hero().querySelector("[data-tier-blason]")).toBeNull();
    });

    test("a Maniac has their TP and no bar, the Maniac has no ceiling", async () => {
      await renderPage({ ...me, rank: { tier: "maniac", tp: 250, shielded: false } }, profile({}));

      expect(within(hero()).getByText("Maniac")).toBeInTheDocument();
      expect(within(hero()).getByText("250 TP")).toBeInTheDocument();
      expect(within(hero()).queryByRole("meter")).not.toBeInTheDocument();
    });

    test("in Placement, the Placement Duels played, one notch each, and no Emblem", async () => {
      await renderPage({ ...me, rank: { placementsLeft: 3 } }, profile({}));

      expect(within(hero()).getByText("Placement")).toBeInTheDocument();
      expect(within(hero()).getByText("2 / 5 Duels")).toBeInTheDocument();
      expect(within(hero()).getByRole("meter", { name: "Placement" })).toHaveAttribute(
        "value",
        "2",
      );
      expect(hero().querySelector("[data-tier-emblem]")).toBeNull();
    });

    test("without a Rating, neither a rank nor a bar", async () => {
      await renderPage(me, profile({}));

      expect(within(hero()).queryByRole("meter")).not.toBeInTheDocument();
      expect(hero().querySelector("[data-tier-emblem]")).toBeNull();
    });

    test("the avatar wears the User's Ornament and gives off its full Aura", async () => {
      const browser = fakeAuraRuntime();

      await renderPage({ ...me, rank: goldII, ornament: "gold" }, profile({}), {
        auraRuntime: browser.runtime,
      });

      await waitFor(() => expect(browser.painters).toHaveLength(1));

      expect(browser.painters[0]?.tier).toBe("gold");
      expect(browser.painters[0]?.canvas.closest("[data-ornament]")).not.toBeNull();
    });
  });

  describe("the wpm card", () => {
    test("shows the average wpm, large, and the curve of the last 50 Duels", async () => {
      await renderPage(me, profile(played));

      const wpm = card("wpm moyen");

      expect(within(wpm).getByText("62")).toBeInTheDocument();
      expect(
        within(wpm).getByRole("figure", {
          name: "Progression wpm sur les 3 derniers Duels, de 60 à 62, moyenne 61",
        }),
      ).toBeInTheDocument();
      expect(within(wpm).getByText("il y a 3 Duels")).toBeInTheDocument();
      expect(within(wpm).getByText("dernier Duel")).toBeInTheDocument();
      expect(within(wpm).getByRole("button", { name: "50 derniers" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(within(wpm).getByRole("button", { name: "tous" })).toBeInTheDocument();
      expect(within(wpm).queryByRole("button", { name: "200 derniers" })).not.toBeInTheDocument();
    });

    test("says how far the wpm went over the window", async () => {
      await renderPage(
        me,
        profile({ ...played, progression: points([...steady(10, 80), ...steady(10, 86)]) }),
      );

      const wpm = card("wpm moyen");

      expect(within(wpm).getByText("+6")).toBeInTheDocument();
      expect(within(wpm).getByText("sur les 20 derniers Duels")).toBeInTheDocument();
    });

    test("and when it went down", async () => {
      await renderPage(
        me,
        profile({ ...played, progression: points([...steady(10, 86), ...steady(10, 83)]) }),
      );

      expect(within(card("wpm moyen")).getByText("−3")).toBeInTheDocument();
    });

    test("a flat trend is no gain", async () => {
      await renderPage(me, profile({ ...played, progression: points(steady(20, 80)) }));

      const wpm = card("wpm moyen");

      expect(within(wpm).getByText("0")).toBeInTheDocument();
      expect(within(wpm).queryByText("+0")).toBeNull();
    });

    test("no trend under 20 Duels", async () => {
      await renderPage(me, profile(played));

      expect(within(card("wpm moyen")).queryByText(/derniers Duels$/)).toBeNull();
    });

    test("every Duel reloads the curve and the trend, never the average", async () => {
      const all = profile({
        ...played,
        averages: { wpm: 999, accuracy: 99 },
        progression: points([...steady(20, 50), ...steady(20, 70)]),
      });

      await renderPage(me, profile(played), { windows: { all } });

      await userEvent.click(screen.getByRole("button", { name: "tous" }));

      const wpm = card("wpm moyen");

      expect(
        await within(wpm).findByRole("figure", {
          name: "Progression wpm sur les 40 derniers Duels, de 50 à 70, moyenne 60",
        }),
      ).toBeInTheDocument();
      expect(within(wpm).getByText("+20")).toBeInTheDocument();
      expect(within(wpm).getByText("62")).toBeInTheDocument();
      expect(within(wpm).getByRole("button", { name: "tous" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  test("shows the win rate, and the wins, Draws and losses it is made of", async () => {
    await renderPage(me, profile(played));

    const winRate = card("taux de victoire");

    expect(within(winRate).getByText("50")).toBeInTheDocument();
    expect(winRate).toHaveTextContent("50 %");
    expect(valueOf(winRate, "victoires")).toBe("2");
    expect(valueOf(winRate, "Draws")).toBe("1");
    expect(valueOf(winRate, "défaites")).toBe("1");
  });

  test("shows the average accuracy", async () => {
    await renderPage(me, profile(played));

    expect(card("accuracy moyenne")).toHaveTextContent("97 %");
  });

  test("shows the three Records, a dash for one never set", async () => {
    await renderPage(me, profile(played));

    const records = card("Records");

    expect(within(records).getByRole("heading", { level: 2 })).toHaveTextContent("Records");
    expect(
      within(records)
        .getAllByRole("term")
        .map((term) => term.textContent),
    ).toEqual(["meilleur wpm", "meilleur Score", "meilleur Combo"]);
    expect(valueOf(records, "meilleur wpm")).toBe("90");
    // Grouped by the narrow no-break space of French.
    expect(valueOf(records, "meilleur Score")).toBe("1 234");
    expect(valueOf(records, "meilleur Combo")).toBe("–");
  });

  test("invites a User without a Duel to play", async () => {
    await renderPage(me, profile({}));

    expect(screen.getByText(/ton premier Duel/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lancer un Duel" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("region", { name: "wpm moyen" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Records" })).not.toBeInTheDocument();
    expect(within(hero()).getByText("0 Duel")).toBeInTheDocument();
  });

  describe("the settings, behind « Modifier le profil »", () => {
    test("are not on the page until asked for", async () => {
      await renderPage(me, profile({}));

      expect(screen.queryByRole("textbox", { name: "Handle" })).not.toBeInTheDocument();
      expect(screen.queryByRole("group", { name: "Ornament" })).not.toBeInTheDocument();
    });

    test("change the Handle, and say what changing it does", async () => {
      await renderPage(me, profile({}));

      const settings = await openSettings();

      expect(within(settings).getByRole("textbox", { name: "Handle" })).toHaveValue("ada");
      expect(within(settings).getByRole("button", { name: "Enregistrer" })).toBeInTheDocument();
      expect(
        within(settings).getByText(/Changer de Handle libère l'ancien aussitôt/),
      ).toBeInTheDocument();
    });

    test("choose the Ornament among the 9, the Tiers above the User's locked", async () => {
      await renderPage(
        { ...me, rank: goldII, ornament: "gold", ornamentChoice: "follow" },
        profile({}),
      );

      const picker = within(await openSettings()).getByRole("group", { name: "Ornament" });

      expect(within(picker).getAllByRole("radio")).toHaveLength(9);
      expect(within(picker).getByRole("radio", { name: "Suivre mon Tier" })).toBeChecked();

      for (const name of ["Suivre mon Tier", "Aucun", "Iron", "Bronze", "Silver", "Gold"]) {
        expect(within(picker).getByRole("radio", { name })).toBeEnabled();
      }

      for (const name of ["Platinum", "Diamond", "Maniac"]) {
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

      const picker = within(await openSettings()).getByRole("group", { name: "Ornament" });

      for (const radio of within(picker).getAllByRole("radio")) {
        expect(radio).toBeEnabled();
      }

      expect(picker).not.toHaveAttribute("aria-describedby");
    });

    test.each([
      ["in Placement", { placementsLeft: 3 }, "follow"],
      ["without a Rating", null, null],
    ] as const)("%s, every Ornament is locked", async (_when, rank, ornamentChoice) => {
      await renderPage({ ...me, rank, ornamentChoice }, profile({}));

      const picker = within(await openSettings()).getByRole("group", { name: "Ornament" });

      expect(picker).toHaveAccessibleDescription("Termine ton Placement");

      for (const radio of within(picker).getAllByRole("radio")) {
        expect(radio).toBeDisabled();
      }
    });

    describe("the Ornament chosen", () => {
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

      const rankedMe: Me = { ...me, rank: goldII, ornament: "gold", ornamentChoice: "follow" };

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      test("is worn by the avatar at once", async () => {
        const fetch = stubSave((choice) => ({
          ...rankedMe,
          ornament: "bronze",
          ornamentChoice: choice,
        }));

        const queryClient = await renderPage(rankedMe, profile({}));
        const settings = await openSettings();

        await userEvent.click(within(settings).getByRole("radio", { name: "Bronze" }));

        await waitFor(() => {
          expect(within(settings).getByRole("radio", { name: "Bronze" })).toBeChecked();
        });
        // Under the open dialog, the header is hidden from assistive tech, not from the eye.
        expect(
          screen
            .getByRole("region", { name: "@ada", hidden: true })
            .querySelector('[data-ornament] use[href="#tier-ornament-bronze"]'),
        ).not.toBeNull();
        expect(queryClient.getQueryData(meQueryOptions.queryKey)?.ornament).toBe("bronze");
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(String(fetch.mock.calls[0]?.[0])).toMatch(/\/api\/me\/ornament$/);
      });

      test("moves with the arrow keys, skipping the locked Ornaments", async () => {
        const fetch = stubSave((choice) => ({
          ...rankedMe,
          ornament: null,
          ornamentChoice: choice,
        }));

        const user = userEvent.setup();

        await renderPage({ ...rankedMe, ornamentChoice: "gold" }, profile({}));

        const settings = await openSettings();

        within(settings).getByRole("radio", { name: "Gold" }).focus();

        await user.keyboard("{ArrowRight}");

        expect(within(settings).getByRole("radio", { name: "Suivre mon Tier" })).toHaveFocus();

        await user.keyboard("{ArrowLeft}{ArrowLeft}");

        expect(within(settings).getByRole("radio", { name: "Silver" })).toHaveFocus();
        await waitFor(() => {
          expect(within(settings).getByRole("radio", { name: "Silver" })).toBeChecked();
        });
        expect(fetch).toHaveBeenCalledTimes(3);
      });
    });
  });

  test("a User without a Handle is told why they need one, and has neither Stats nor Ornament", async () => {
    await renderPage({ ...me, handle: null }, null);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ada");
    expect(
      screen.getByText("Tu n'as pas encore de Handle : sans lui, pas de Duel."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "wpm moyen" })).not.toBeInTheDocument();

    const settings = await openSettings("Modifier le profil", "Ada");

    expect(within(settings).getByRole("textbox", { name: "Handle" })).toHaveValue("ada");
    expect(within(settings).queryByRole("group", { name: "Ornament" })).not.toBeInTheDocument();
  });

  describe("in English", () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: "en" });
    });

    test("the header: the Duels played, and the way to the settings", async () => {
      await renderPage(me, profile(played));

      expect(within(hero()).getByText("4 Duels")).toBeInTheDocument();
      expect(await openSettings("Edit profile")).toBeInTheDocument();
    });

    test("the header's rank: its TP and how far the next", async () => {
      await renderPage({ ...me, rank: goldII }, profile({}));

      expect(within(hero()).getByText("42/100 TP")).toBeInTheDocument();
      expect(within(hero()).getByText("58 TP to Gold I")).toBeInTheDocument();
    });

    test("a Maniac's TP, grouped the English way", async () => {
      await renderPage({ ...me, rank: { tier: "maniac", tp: 1284, shielded: false } }, profile({}));

      expect(within(hero()).getByText("1,284 TP")).toBeInTheDocument();
    });

    test("the wpm card, its curve, its trend and its windows", async () => {
      await renderPage(
        me,
        profile({ ...played, progression: points([...steady(10, 80), ...steady(10, 86)]) }),
      );

      const wpm = card("average wpm");

      expect(
        within(wpm).getByRole("figure", {
          name: "wpm Progression over the last 20 Duels, from 80 to 86, average 83",
        }),
      ).toBeInTheDocument();
      expect(within(wpm).getByText("over the last 20 Duels")).toBeInTheDocument();
      expect(within(wpm).getByText("20 Duels ago")).toBeInTheDocument();
      expect(within(wpm).getByText("last Duel")).toBeInTheDocument();
      expect(within(wpm).getByRole("group", { name: "Progression window" })).toBeInTheDocument();
      expect(within(wpm).getByRole("button", { name: "last 50" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(within(wpm).getByRole("button", { name: "all" })).toBeInTheDocument();
    });

    test("the shares the English way, the Records grouped", async () => {
      await renderPage(me, profile(played));

      expect(card("win rate")).toHaveTextContent("50%");
      expect(valueOf(card("win rate"), "wins")).toBe("2");
      expect(card("average accuracy")).toHaveTextContent("97%");
      expect(valueOf(card("Records"), "best Score")).toBe("1,234");
      expect(valueOf(card("Records"), "best Combo")).toBe("–");
    });

    test("invites a User without a Duel to play", async () => {
      await renderPage(me, profile({}));

      expect(screen.getByText("No Duels yet")).toBeInTheDocument();
      expect(
        screen.getByText("Your Stats will show up after your first finished Duel."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start a Duel" })).toHaveAttribute("href", "/");
    });

    test("a User without a Handle is told why they need one", async () => {
      await renderPage({ ...me, handle: null }, null);

      expect(
        screen.getByText("You don't have a Handle yet, and you need one to play Duels."),
      ).toBeInTheDocument();
    });
  });
});

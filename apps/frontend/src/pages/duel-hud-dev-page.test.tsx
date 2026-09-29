import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { ClockContext } from "@/components/run/clock-context";
import { DuelHudDevPage } from "@/pages/duel-hud-dev-page";
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

// The page's clock, moved by hand.
let now = 0;

beforeEach(() => {
  now = 0;
});

const renderPage = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(friendsQueryOptions.queryKey, []);

  const rootRoute = createRootRoute();

  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dev/duel-hud",
    component: DuelHudDevPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: ["/dev/duel-hud"] }),
  });

  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <ClockContext value={() => now}>
        <RouterProvider router={router} />
      </ClockContext>
    </QueryClientProvider>,
  );
  await screen.findByRole("combobox", { name: "Moment" });
};

// A player's half of the band.
const half = (player: string) => screen.getByRole("region", { name: player });

// One figure of a player's half, as it reads after what screen readers call it.
const figure = (player: string, pattern: RegExp) => half(player).textContent?.match(pattern)?.[1];

// Score, multiplier and the pips the Combo lit, as the board shows them.
const scoreOf = (player: string) => [
  figure(player, /Score (\d+)/),
  figure(player, /multiplicateur (×\d)/),
  within(half(player)).getByRole("meter", { name: "Combo" }).getAttribute("value"),
];

// A word is split into one element per letter: match the element that holds them all. The
// board's Text comes first, before the words the Seed draws past it.
const isWord = (word: string) => (_: string, element: Element | null) =>
  element !== null && element.children.length > 0 && element.textContent === word;

// Its letters only: a Wrong word holds its wave too.
const statuses = (word: string) =>
  Array.from(
    screen.getAllByText(isWord(word))[0]?.querySelectorAll("[data-status]") ?? [],
    (letter) => letter.getAttribute("data-status"),
  );

// The Text's rows as shown, each word's letters read in a row.
const rows = () =>
  Array.from(document.querySelectorAll("[data-text-row]"), (row) =>
    Array.from(row.querySelectorAll("[data-word]"), (word) => word.textContent).join(" "),
  );

// A letter typed right (`c`), typed wrong (`i`), or still to type.
const statusOf = (letter: string) => {
  if (letter === "c") {
    return "correct";
  }

  return letter === "i" ? "incorrect" : "pending";
};

// The page, frozen on one of the board's moments.
const freezeOn = async (moment: string) => {
  await renderPage();
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Moment" }), moment);
};

describe("DuelHudDevPage", () => {
  test("draws the Duel's scene: the sidebar hidden, its own header inert, the Duel ranked", async () => {
    await renderPage();

    const header = screen.getByRole("banner");

    expect(screen.getByLabelText("Barre latérale")).not.toBeVisible();
    expect(header).toHaveAttribute("inert");
    expect(within(header).getByText("Duel classé · 30 s · anglais")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitter le Duel" })).toBeEnabled();
  });

  // The Scores, multipliers and pips lit the board's own engine shows at each of its moments (a
  // Combo of 15 lights all 14), and the seconds its disc shows.
  test.each([
    ["mi-duel", ["120", "×3", "10"], ["88", "×1", "3"], "20"],
    ["burst", ["183", "×3", "12"], ["95", "×2", "4"], "18"],
    ["combo cassé", ["207", "×1", "0"], ["123", "×2", "6"], "16"],
    ["mené", ["288", "×2", "8"], ["338", "×4", "14"], "8"],
    ["dernières secondes", ["411", "×3", "13"], ["417", "×1", "2"], "3"],
    ["renversement", ["435", "×4", "14"], ["432", "×2", "4"], "1"],
    ["fin", ["463", "×4", "14"], ["442", "×2", "4"], "FIN"],
  ])(
    "frozen on « %s », shows the board's Scores and Combos",
    async (moment, self, opponent, left) => {
      await renderPage();

      await userEvent.selectOptions(screen.getByRole("combobox", { name: "Moment" }), moment);

      expect(scoreOf("Toi")).toEqual(self);
      expect(scoreOf("@kzr_")).toEqual(opponent);
      expect(screen.getByRole("timer", { name: "temps restant" })).toHaveTextContent(left);
    },
  );

  // Where this User's caret stands on the board at each moment: the word before it typed right,
  // the letters of its word typed so far.
  test.each([
    ["mi-duel", "every", "simple", "ccc---"],
    ["burst", "window", "morning", "c------"],
    ["combo cassé", "morning", "quick", "cci--"],
    ["mené", "summer", "happy", "-----"],
    ["dernières secondes", "market", "kitchen", "c------"],
    ["renversement", "kitchen", "gentle", "ccc---"],
    ["fin", "gentle", "picture", "-------"],
  ])(
    "frozen on « %s », this User is past « %s », in « %s » as on the board",
    async (moment, previous, current, typed) => {
      await renderPage();

      await userEvent.selectOptions(screen.getByRole("combobox", { name: "Moment" }), moment);

      expect(statuses(previous)).toEqual(Array.from(previous, () => "correct"));
      expect(statuses(current)).toEqual(Array.from(typed, statusOf));
    },
  );

  // The rows the board's Text shows at these moments, as its own engine cuts them: 41 characters at
  // most, the line of this User's word the second once past the first.
  test.each([
    [
      "mi-duel",
      [
        "river light chair after music bright",
        "story forest garden every simple window",
        "morning quick travel before friend water",
      ],
    ],
    [
      "mené",
      [
        "morning quick travel before friend water",
        "paper strange summer happy island",
        "neighbor shadow market kitchen gentle",
      ],
    ],
    [
      "fin",
      [
        "neighbor shadow market kitchen gentle",
        "picture always world bridge heavy climb",
        "coffee number young evening winter narrow",
      ],
    ],
  ])("frozen on « %s », shows the rows of the board's Text", async (moment, shown) => {
    await renderPage();

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Moment" }), moment);

    expect(rows()).toEqual(shown);
  });

  // The Callout the board announces at each moment, by its own engine, then the verdict at the end.
  test.each([
    ["mi-duel", ""],
    ["burst", "BURST +42"],
    ["combo cassé", "COMBO CASSÉ 13 mots"],
    ["mené", "BURST @kzr_ +56"],
    ["dernières secondes", "BURST +42"],
    ["renversement", "TU PASSES DEVANT"],
    ["fin", "VICTOIRE +21"],
  ])("frozen on « %s », announces the board's Callout", async (moment, said) => {
    await renderPage();

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Moment" }), moment);

    expect(screen.getByRole("status", { name: "Callouts" }).textContent?.trim()).toBe(said);
  });

  test("plays the Duel in a loop, from GO again once it is over", async () => {
    await renderPage();

    expect(scoreOf("Toi")).toEqual(["0", "×1", "0"]);

    now = 12_250;
    await waitFor(() => expect(scoreOf("Toi")).toEqual(["183", "×3", "12"]));

    now = 34_800 + 12_250;
    await waitFor(() => expect(scoreOf("@kzr_")).toEqual(["95", "×2", "4"]));
  });

  test("plays in a loop again once unfrozen", async () => {
    await renderPage();

    const moment = screen.getByRole("combobox", { name: "Moment" });

    await userEvent.selectOptions(moment, "fin");
    now = 10_600;
    await userEvent.selectOptions(moment, "en boucle");
    now = 10_600 + 12_250;

    await waitFor(() => expect(scoreOf("Toi")).toEqual(["183", "×3", "12"]));
  });
});

describe("DuelHudDevPage in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test.each([
    ["burst", "BURST +42"],
    ["combo cassé", "COMBO BROKEN 13 words"],
    ["mené", "BURST @kzr_ +56"],
    ["renversement", "YOU TAKE THE LEAD"],
    ["fin", "VICTORY +21"],
  ])("frozen on « %s », announces the board's Callout in English", async (moment, said) => {
    await freezeOn(moment);

    expect(screen.getByRole("status", { name: "Callouts" }).textContent?.trim()).toBe(said);
  });

  test("names both halves, their figures, the band's Lead and the way out", async () => {
    await freezeOn("mené");

    expect(half("You").textContent).toMatch(/Score 288/);
    expect(half("You").textContent).toMatch(/multiplier ×2/);
    expect(within(half("@kzr_")).getByRole("meter", { name: "Combo" })).toHaveAttribute(
      "value",
      "14",
    );
    expect(screen.getByRole("region", { name: "@kzr_ leads by 50 points" })).toBeInTheDocument();
    expect(screen.getByRole("timer", { name: "time left" })).toHaveTextContent("8");
    expect(screen.getByRole("button", { name: "Leave the Duel" })).toBeEnabled();
  });

  test("says END once the time is up", async () => {
    await freezeOn("fin");

    expect(screen.getByRole("timer", { name: "time left" })).toHaveTextContent("END");
    expect(screen.getByRole("region", { name: "You lead by 21 points" })).toBeInTheDocument();
  });
});

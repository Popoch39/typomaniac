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

// One statistic of a player's Score, as the HUD shows it.
const stat = (player: string, term: string) =>
  within(screen.getByRole("region", { name: `Score de ${player}` })).getByText(term)
    .nextElementSibling?.textContent;

// Score, multiplier and Combo, as the board shows them.
const scoreOf = (player: string) => [
  stat(player, "score"),
  stat(player, "multiplicateur"),
  stat(player, "combo"),
];

// A word is split into one element per letter: match the element that holds them all. The
// board's Text comes first, before the words the Seed draws past it.
const isWord = (word: string) => (_: string, element: Element | null) =>
  element !== null && element.children.length > 0 && element.textContent === word;

const statuses = (word: string) =>
  Array.from(screen.getAllByText(isWord(word))[0]?.children ?? [], (letter) =>
    letter.getAttribute("data-status"),
  );

// A letter typed right (`c`), typed wrong (`i`), or still to type.
const statusOf = (letter: string) => {
  if (letter === "c") {
    return "correct";
  }

  return letter === "i" ? "incorrect" : "pending";
};

describe("DuelHudDevPage", () => {
  test("draws the Duel's scene: its header inert, the Duel ranked", async () => {
    await renderPage();

    const header = screen.getByRole("banner");

    expect(header).toHaveAttribute("inert");
    expect(within(header).getByText("Duel classé · 30 s · anglais")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitter le Duel" })).toBeEnabled();
  });

  // The Scores, multipliers and Combos the board's own engine shows at each of its moments, and
  // the seconds its disc shows.
  test.each([
    ["mi-duel", ["120", "x3", "10"], ["88", "x1", "3"], "20"],
    ["burst", ["183", "x3", "12"], ["95", "x2", "4"], "18"],
    ["combo cassé", ["207", "x1", "0"], ["123", "x2", "6"], "16"],
    ["mené", ["288", "x2", "8"], ["338", "x4", "15"], "8"],
    ["dernières secondes", ["411", "x3", "13"], ["417", "x1", "2"], "3"],
    ["renversement", ["435", "x4", "14"], ["432", "x2", "4"], "1"],
    ["fin", ["463", "x4", "15"], ["442", "x2", "4"], "0"],
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

  test("plays the Duel in a loop, from GO again once it is over", async () => {
    await renderPage();

    expect(scoreOf("Toi")).toEqual(["0", "x1", "0"]);

    now = 12_250;
    await waitFor(() => expect(scoreOf("Toi")).toEqual(["183", "x3", "12"]));

    now = 34_800 + 12_250;
    await waitFor(() => expect(scoreOf("@kzr_")).toEqual(["95", "x2", "4"]));
  });

  test("plays in a loop again once unfrozen", async () => {
    await renderPage();

    const moment = screen.getByRole("combobox", { name: "Moment" });

    await userEvent.selectOptions(moment, "fin");
    now = 10_600;
    await userEvent.selectOptions(moment, "en boucle");
    now = 10_600 + 12_250;

    await waitFor(() => expect(scoreOf("Toi")).toEqual(["183", "x3", "12"]));
  });
});

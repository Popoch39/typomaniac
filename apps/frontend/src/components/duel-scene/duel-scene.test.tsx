import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ServerMessage } from "api";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { AppFrame } from "@/components/app-frame";
import { ClockContext } from "@/components/run/clock-context";
import { HomePage } from "@/pages/home-page";
import { useConnectionStore } from "@/stores/connection-store";
import { useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { fakeServer } from "@/test/fake-socket";
import { holdGsapClock } from "@/test/gsap-clock";

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

const placement = { placementsLeft: 5 };

// A Duel found in the Queue, its start far enough for the Countdown to still run.
const duelFound = (selfRank: typeof placement | null): ServerMessage => ({
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language: "en",
    wordListVersion: 1,
    seconds: 30,
    startsAt: 60_000,
  },
  opponent: { handle: "kzr_", image: null, ornament: null },
  selfOrnament: null,
  serverTime: 0,
  pace: 50,
  opponentPace: 50,
  selfRank,
  opponentRank: selfRank,
  selfForm: null,
  opponentForm: null,
  selfStake: null,
});

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

const duelEnded: ServerMessage = {
  type: "duel-ended",
  duelId: null,
  ranked: null,
  outcome: "draw",
  forfeit: false,
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
  opponent: { handle: "kzr_", image: null },
};

let sockets = fakeServer();

let gsapClock = holdGsapClock();

const server = () => sockets.server();

// The server's messages reach the store outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

beforeEach(() => {
  usePlayStore.setState({ play: "duel" });
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useConnectionStore.getState().open(sockets.open);
  server().receive({ type: "idle" });
});

afterEach(() => {
  gsapClock.release();
  useConnectionStore.getState().close();
  usePlayStore.setState(usePlayStore.getInitialState());
});

// The play page in the app's frame, Duel chosen by Ada, on a clock stopped at 0: the Countdown
// never ends.
const renderPlayPage = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(friendsQueryOptions.queryKey, []);

  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <AppFrame>
          <HomePage />
        </AppFrame>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ClockContext value={() => 0}>
          <RouterProvider router={router} />
        </ClockContext>
      </QueryClientProvider>
    </StrictMode>,
  );
  await screen.findByRole("heading", { name: "Ou défie un ami" });
  receive({ type: "queued" });
};

const settings = () => screen.queryByRole("group", { name: "Réglages" });

describe("the Duel's scene, from the Countdown to the end of the Duel", () => {
  test("in the Queue, the app keeps its header and its settings", async () => {
    await renderPlayPage();

    const header = screen.getByRole("banner");

    expect(header).not.toHaveAttribute("inert");
    expect(within(header).getByRole("link", { name: "Thèmes" })).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "Menu de Ada" })).toBeInTheDocument();
    expect(settings()).toBeInTheDocument();
  });

  test("once paired, the header is inert, without Thèmes nor the User's menu, and the settings are gone", async () => {
    await renderPlayPage();
    receive(duelFound(placement));

    const header = screen.getByRole("banner");

    expect(header).toHaveAttribute("inert");
    expect(within(header).queryByRole("link", { name: "Thèmes" })).not.toBeInTheDocument();
    expect(within(header).queryByRole("button", { name: "Menu de Ada" })).not.toBeInTheDocument();
    expect(within(header).getByRole("link", { name: "Classement" })).toBeInTheDocument();
    expect(settings()).not.toBeInTheDocument();
  });

  test("a Duel of the Queue says it is ranked, at the right of the header", async () => {
    await renderPlayPage();
    receive(duelFound(placement));

    expect(
      within(screen.getByRole("banner")).getByText("Duel classé · 30 s · anglais"),
    ).toBeInTheDocument();
  });

  test("a Challenge says so, never ranked", async () => {
    await renderPlayPage();
    receive(duelFound(null));

    const header = screen.getByRole("banner");

    expect(within(header).getByText("Challenge · 30 s · anglais")).toBeInTheDocument();
    expect(within(header).queryByText(/Duel classé/)).not.toBeInTheDocument();
  });

  test("Quitter le Duel stays the way out, by a Forfeit", async () => {
    await renderPlayPage();
    receive(duelFound(placement));

    await userEvent.click(screen.getByRole("button", { name: "Quitter le Duel" }));

    expect(server().sent).toContainEqual({ type: "leave-duel" });
    expect(useDuelStore.getState().state.phase).toBe("countdown");
  });

  test("on the end screen, the app gets its header back", async () => {
    await renderPlayPage();
    receive(duelFound(placement));
    receive(duelEnded);

    await screen.findByRole("button", { name: "Nouveau Duel" });

    const header = screen.getByRole("banner");

    expect(header).not.toHaveAttribute("inert");
    expect(within(header).getByRole("link", { name: "Thèmes" })).toBeInTheDocument();
    expect(within(header).queryByText(/· 30 s ·/)).not.toBeInTheDocument();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ServerMessage } from "api";
import { StrictMode } from "react";
import type { Language } from "typing-engine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { AppFrame } from "@/components/app-frame";
import { DuelOnItsUrl } from "@/components/duel/duel-on-its-url";
import { DuelPlace } from "@/components/duel/duel-place";
import { QueueProposal } from "@/components/match-proposal/queue-proposal";
import { ClockContext } from "@/components/run/clock-context";
import { DuelPage } from "@/pages/duel-page";
import { HomePage } from "@/pages/home-page";
import { useConnectionStore } from "@/stores/connection-store";
import { useLocaleStore } from "@/stores/locale-store";
import { usePlayStore } from "@/stores/play-store";
import { fakeServer, idle } from "@/test/fake-socket";
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
  place: null,
};

const placement = { placementsLeft: 5 };

// A Duel found in the Queue, its start far enough for the Countdown to still run.
const duelFound = (
  selfRank: typeof placement | null,
  { language = "en", seconds = 30 }: { language?: Language; seconds?: number } = {},
): ServerMessage => ({
  type: "duel-found",
  duel: {
    id: "duel-1",
    seed: 42,
    language,
    wordListVersion: 1,
    seconds,
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
  duelId: "duel-1",
  ranked: null,
  records: null,
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

// Paired: the Duel found is played on its own URL.
const pair = async (message: ServerMessage) => {
  receive(message);
  await screen.findByRole("heading", { level: 1, name: "Duel" });
};

beforeEach(() => {
  usePlayStore.setState({ play: "duel" });
  sockets = fakeServer();
  gsapClock = holdGsapClock();
  useConnectionStore.getState().open(sockets.open);
  server().receive(idle());
});

afterEach(() => {
  gsapClock.release();
  vi.restoreAllMocks();
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

  // The play page and the Duel's, in the app's frame, with what holds the User's place, shows its
  // Match proposal and takes a Duel found to its URL.
  const root = createRootRoute({
    component: () => (
      <>
        <AppFrame>
          <Outlet />
        </AppFrame>
        <DuelPlace />
        <QueueProposal />
        <DuelOnItsUrl />
      </>
    ),
  });

  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: "/", component: HomePage }),
      createRoute({ getParentRoute: () => root, path: "/duel", component: DuelPage }),
    ]),
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
  await screen.findByRole("heading", { name: "On te trouve un adversaire…" });
  receive({ type: "queued" });
};

const settings = () => screen.queryByRole("group", { name: "Réglages" });

// The sidebar, even out of sight (where it has no accessible name).
const sidebar = () => screen.getByLabelText("Barre latérale");

describe("the Duel's scene, from the Countdown to the end of the Duel", () => {
  test("in the Queue, the app keeps its sidebar, without the scene's header nor the Run's settings", async () => {
    await renderPlayPage();

    expect(sidebar()).toBeVisible();
    expect(sidebar()).not.toHaveAttribute("inert");
    expect(within(sidebar()).getByRole("button", { name: "Menu de ada" })).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(settings()).not.toBeInTheDocument();
  });

  test("the Match proposal is in the page, the sidebar still there", async () => {
    await renderPlayPage();
    receive({
      type: "match-proposed",
      expiresAt: 10_000,
      serverTime: 0,
      opponent: { handle: "kzr_", image: null, ornament: null },
      selfOrnament: null,
      selfRank: placement,
      opponentRank: placement,
      selfAccepted: false,
      opponentAccepted: false,
      dodgeLock: null,
    });

    expect(await screen.findByRole("region", { name: "Adversaire trouvé !" })).toBeInTheDocument();
    expect(sidebar()).not.toHaveAttribute("hidden");
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  test("once paired, the sidebar is hidden and inert, never unmounted, and the settings are gone", async () => {
    await renderPlayPage();

    const before = sidebar();

    await pair(duelFound(placement));

    expect(sidebar()).toBe(before);
    expect(sidebar()).not.toBeVisible();
    expect(sidebar()).toHaveAttribute("hidden");
    expect(sidebar()).toHaveAttribute("inert");
    expect(screen.queryByRole("link", { name: "Classement" })).not.toBeInTheDocument();
    expect(settings()).not.toBeInTheDocument();
  });

  test("once paired, the scene has its own header, inert: the brand and the Duel's format", async () => {
    await renderPlayPage();
    await pair(duelFound(placement));

    const header = screen.getByRole("banner");

    expect(header).toHaveAttribute("inert");
    expect(within(header).getByRole("link", { name: "typomaniac" })).toBeInTheDocument();
  });

  test("a Duel of the Queue says it is ranked, at the right of the header", async () => {
    await renderPlayPage();
    await pair(duelFound(placement));

    expect(
      within(screen.getByRole("banner")).getByText("Duel classé · 30 s · anglais"),
    ).toBeInTheDocument();
  });

  test("a Challenge says so, never ranked", async () => {
    await renderPlayPage();
    await pair(duelFound(null));

    const header = screen.getByRole("banner");

    expect(within(header).getByText("Challenge · 30 s · anglais")).toBeInTheDocument();
    expect(within(header).queryByText(/Duel classé/)).not.toBeInTheDocument();
  });

  test("Quitter le Duel stays the way out, by a Forfeit", async () => {
    await renderPlayPage();
    await pair(duelFound(placement));

    await userEvent.click(screen.getByRole("button", { name: "Quitter le Duel" }));

    expect(server().sent).toContainEqual({ type: "leave-duel" });
  });

  test("on the end screen, the app gets its sidebar back, the scene's header gone", async () => {
    await renderPlayPage();

    const before = sidebar();

    await pair(duelFound(placement));
    receive(duelEnded);

    await screen.findByRole("button", { name: "Nouveau Duel" });

    expect(sidebar()).toBe(before);
    expect(sidebar()).toBeVisible();
    expect(sidebar()).not.toHaveAttribute("inert");
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByText(/· 30 s ·/)).not.toBeInTheDocument();
  });

  test("the sidebar slides back in, from no width to its own, and keeps no inline style", async () => {
    await renderPlayPage();
    await pair(duelFound(placement));
    receive(duelEnded);
    await screen.findByRole("button", { name: "Nouveau Duel" });

    expect(sidebar().style.width).toBe("0px");
    expect(sidebar().style.overflow).toBe("hidden");

    await gsapClock.advance(0.32);

    expect(sidebar().style.width).toBe("");
    expect(sidebar().style.overflow).toBe("");
  });

  test("under reduced motion, the sidebar is back at once", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((media) => ({
      matches: media === "(prefers-reduced-motion: reduce)",
      media,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }));

    await renderPlayPage();
    await pair(duelFound(placement));
    receive(duelEnded);
    await screen.findByRole("button", { name: "Nouveau Duel" });

    expect(sidebar().style.width).toBe("");
  });
});

// The play page shown in French, then switched to English.
const renderInEnglish = async () => {
  await renderPlayPage();
  act(() => useLocaleStore.setState({ locale: "en" }));
};

describe("the Duel's scene in English", () => {
  test("the header says the kind of Duel, its time and its Language", async () => {
    await renderInEnglish();
    await pair(duelFound(placement));

    expect(
      within(screen.getByRole("banner")).getByText("Ranked Duel · 30 s · English"),
    ).toBeInTheDocument();
  });

  test("the format is the Duel's own: a Challenge of another time and Language says so", async () => {
    await renderInEnglish();
    await pair(duelFound(null, { language: "fr", seconds: 60 }));

    expect(
      within(screen.getByRole("banner")).getByText("Challenge · 60 s · French"),
    ).toBeInTheDocument();
  });
});

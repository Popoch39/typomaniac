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
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelArea } from "@/components/duel/duel-area";
import { ClockContext } from "@/components/run/clock-context";
import { useConnectionStore } from "@/stores/connection-store";
import { useLocaleStore } from "@/stores/locale-store";
import { fakeServer, idle } from "@/test/fake-socket";

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

// The tab's clock, moved by hand.
let now = 0;

let sockets = fakeServer();

const server = () => sockets.server();

// The server's messages reach the store outside of React.
const receive = (message: ServerMessage) => act(() => server().receive(message));

// The tab's clock moves on to `ms`, and the countdown reads it.
const at = async (ms: number) => {
  now = ms;
  await act(async () => vi.advanceTimersByTime(250));
};

beforeEach(() => {
  now = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  sockets = fakeServer();
  useConnectionStore.getState().open(sockets.open);
  server().receive(idle());
});

afterEach(() => {
  useConnectionStore.getState().close();
  vi.useRealTimers();
});

// DuelArea shown for Ada: it joins the Queue.
const renderDuel = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, me);
  queryClient.setQueryData(friendsQueryOptions.queryKey, []);

  const router = createRouter({
    routeTree: createRootRoute({ component: DuelArea }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <ClockContext value={() => now}>
        <RouterProvider router={router} />
      </ClockContext>
    </QueryClientProvider>,
  );
};

const TIP = "En attendant, défie un Friend en ligne : le premier Duel qui aboutit l'emporte.";

describe("the Queue screen", () => {
  test("one card: the search, its format, the wait and Annuler; the Friends to challenge are left to the sidebar", async () => {
    await renderDuel();
    receive({ type: "queued" });

    // The server's clock runs 12 s ahead of this tab's: Ada has waited 12 s.
    receive({
      type: "queue-status",
      joinedAt: 0,
      serverTime: 12_000,
      size: 14,
      estimatedWait: 8000,
    });

    const card = screen.getByRole("region", { name: "On te trouve un adversaire…" });

    expect(within(card).getByText("Duel classé · 30 s · anglais")).toBeInTheDocument();
    expect(within(card).getByLabelText("Temps d'attente")).toHaveTextContent("0:12");
    expect(within(card).getByText("≈ 8 s d'attente · 14 joueurs en file")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Annuler" })).toBeInTheDocument();

    expect(screen.getByText(TIP)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ou défie un ami" })).not.toBeInTheDocument();
  });

  test("the wait counts on, second by second", async () => {
    await renderDuel();
    receive({ type: "queued" });
    receive({ type: "queue-status", joinedAt: 0, serverTime: 0, size: 1, estimatedWait: null });

    expect(screen.getByLabelText("Temps d'attente")).toHaveTextContent("0:00");
    expect(screen.getByText("1 joueur en file")).toBeInTheDocument();

    await at(65_000);
    expect(screen.getByLabelText("Temps d'attente")).toHaveTextContent("1:05");
  });

  test("a Queue lock takes the card's place: Queue bloquée and its buttons, without the tip", async () => {
    await renderDuel();
    receive({ type: "queue-locked", until: 60_000, serverTime: 0 });

    const card = await screen.findByRole("region", { name: "Queue bloquée" });

    expect(within(card).getByRole("button", { name: "Retour au Solo" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /Chercher un Duel/ })).toBeDisabled();
    expect(
      screen.queryByRole("region", { name: "On te trouve un adversaire…" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(TIP)).not.toBeInTheDocument();
  });
});

describe("the Queue screen in English", () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: "en" });
  });

  test("the search, its format, the wait, the players waiting and the tip", async () => {
    await renderDuel();
    receive({ type: "queued" });
    receive({
      type: "queue-status",
      joinedAt: 0,
      serverTime: 12_000,
      size: 1284,
      estimatedWait: 8000,
    });

    const card = screen.getByRole("region", { name: "Finding you an opponent…" });

    expect(within(card).getByText("Ranked Duel · 30 s · English")).toBeInTheDocument();
    expect(within(card).getByLabelText("Wait time")).toHaveTextContent("0:12");
    expect(within(card).getByText("≈ 8 s wait · 1,284 players in the Queue")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "While you wait, challenge a Friend who's online: whichever Duel comes together first is the one you play.",
      ),
    ).toBeInTheDocument();
  });

  test("a single player waiting is counted as one", async () => {
    await renderDuel();
    receive({ type: "queued" });
    receive({ type: "queue-status", joinedAt: 0, serverTime: 0, size: 1, estimatedWait: null });

    expect(screen.getByText("1 player in the Queue")).toBeInTheDocument();
  });

  test("a Queue lock: its title, why, and the way back to Solo", async () => {
    await renderDuel();
    receive({ type: "queue-locked", until: 60_000, serverTime: 0 });

    const card = await screen.findByRole("region", { name: "Queue locked" });

    expect(
      within(card).getByText(
        "You can search again when the countdown ends. You can still challenge a Friend.",
      ),
    ).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Back to Solo" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /Find a Duel/ })).toHaveTextContent("1:00");
  });

  test("another tab playing the place: said, with the way to play here", async () => {
    await renderDuel();
    receive({ type: "elsewhere", place: "queue" });

    expect(await screen.findByText("This Duel is open in another tab.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play here" })).toBeInTheDocument();
  });
});

describe("the Queue screen during a Queue lock", () => {
  test("Chercher un Duel waits for the end of the lock, on the server's clock, then joins the Queue", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderDuel();
    expect(server().sent).toEqual([{ type: "join-queue" }]);

    // The server's clock runs 20 s ahead of this tab's: the lock ends at 60 s here.
    receive({ type: "queue-locked", until: 80_000, serverTime: 20_000 });

    const search = await screen.findByRole("button", { name: /Chercher un Duel/ });

    expect(screen.getByRole("heading", { name: "Queue bloquée" })).toBeInTheDocument();
    expect(search).toBeDisabled();
    expect(search).toHaveTextContent("1:00");

    await at(59_001);
    expect(search).toBeDisabled();
    expect(search).toHaveTextContent("0:01");

    // Over: searching is open again, and nothing was sent meanwhile.
    await at(60_000);
    expect(screen.getByRole("button", { name: "Chercher un Duel" })).toBeEnabled();
    expect(server().sent).toEqual([{ type: "join-queue" }]);

    await user.click(screen.getByRole("button", { name: "Chercher un Duel" }));
    expect(server().sent).toEqual([{ type: "join-queue" }, { type: "join-queue" }]);

    receive({ type: "queued" });
    expect(await screen.findByText("On te trouve un adversaire…")).toBeInTheDocument();
  });

  test("a tab opened or reloaded during the lock shows it from its place at once", async () => {
    // A new socket, whose place is not told yet.
    useConnectionStore.getState().open(sockets.open);
    await renderDuel();

    // The server's clock runs 20 s ahead of this tab's: the lock ends at 60 s here.
    receive(idle(80_000, 20_000));

    const search = await screen.findByRole("button", { name: /Chercher un Duel/ });

    expect(search).toBeDisabled();
    expect(search).toHaveTextContent("1:00");

    // The Queue is asked all the same: it holds the lock.
    expect(server().sent).toEqual([{ type: "join-queue" }]);
    receive({ type: "queue-locked", until: 80_000, serverTime: 20_000 });

    await at(60_000);
    expect(screen.getByRole("button", { name: "Chercher un Duel" })).toBeEnabled();
    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });

  test("another tab shows the lock as soon as the Dodge played elsewhere imposes one", async () => {
    await renderDuel();
    receive({ type: "elsewhere", place: "queue" });
    expect(await screen.findByText("Le Duel est ouvert dans un autre onglet.")).toBeInTheDocument();

    // A free Dodge there: nothing to show here.
    receive(idle());
    expect(screen.getByText("Le Duel est ouvert dans un autre onglet.")).toBeInTheDocument();

    receive({ type: "elsewhere", place: "queue" });
    receive(idle(80_000, 20_000));

    const search = await screen.findByRole("button", { name: /Chercher un Duel/ });

    expect(screen.getByRole("heading", { name: "Queue bloquée" })).toBeInTheDocument();
    expect(search).toBeDisabled();
    expect(search).toHaveTextContent("1:00");

    await at(60_000);
    expect(screen.getByRole("button", { name: "Chercher un Duel" })).toBeEnabled();
    expect(server().sent).toEqual([{ type: "join-queue" }]);
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { friendsQueryOptions } from "@/api/friends";
import { type Me, meQueryOptions } from "@/api/me";
import { DuelArea } from "@/components/duel/duel-area";
import { ClockContext } from "@/components/run/clock-context";
import { useConnectionStore } from "@/stores/connection-store";
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

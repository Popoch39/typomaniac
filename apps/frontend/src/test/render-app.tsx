import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { defaultPace } from "typing-engine";

import { activityQueryOptions } from "@/api/activity";
import { duelHistoryQueryOptions } from "@/api/duel-history";
import { type Friend, friendRequestsQueryOptions, friendsQueryOptions } from "@/api/friends";
import { leaderboardQueryOptions } from "@/api/leaderboard";
import { type Me, meQueryOptions } from "@/api/me";
import { paceQueryOptions } from "@/api/pace";
import { profileQueryOptions } from "@/api/profile";
import { createAppRouter } from "@/app-router";
import { LiveSocketContext } from "@/components/live-socket-context";
import { ClockContext } from "@/components/run/clock-context";
import type { OpenLiveSocket } from "@/stores/connection-store";

export const ada: Me = {
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

// A Friend of the reader, known by their Handle.
export const friend = (handle: string): Friend => ({
  id: `${handle}-id`,
  handle,
  image: null,
  ornament: null,
});

// The cache as the root route's beforeLoad leaves it, for `reader` and their `friends`, or for a
// Visitor.
const cacheFor = (reader: Me | null, friends: readonly Friend[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, reader);
  queryClient.setQueryData(paceQueryOptions(reader).queryKey, defaultPace);
  queryClient.setQueryData(friendsQueryOptions.queryKey, [...friends]);
  // What /friends, /leaderboard and /duels load: nothing yet.
  queryClient.setQueryData(friendRequestsQueryOptions.queryKey, { received: [], sent: [] });
  queryClient.setQueryData(activityQueryOptions.queryKey, []);
  queryClient.setQueryData(leaderboardQueryOptions({}).queryKey, {
    entries: [],
    me: null,
    firstPlace: 1,
    lastPlace: 0,
    total: 0,
    previous: null,
    next: null,
  });
  queryClient.setQueryData(duelHistoryQueryOptions.queryKey, {
    pages: [{ duels: [], next: null }],
    pageParams: [null],
  });

  // What /profile loads: no Duel yet.
  if (reader?.handle) {
    queryClient.setQueryData(profileQueryOptions(reader.handle).queryKey, {
      handle: reader.handle,
      image: reader.image,
      rank: null,
      ornament: null,
      stats: {
        duels: 0,
        record: { wins: 0, losses: 0, draws: 0 },
        averages: { wpm: null, accuracy: null },
        records: { wpm: null, score: null, combo: null },
        progression: [],
      },
    });
  }

  return queryClient;
};

type AppFor = {
  // Null for a Visitor.
  reader: Me | null;
  // The fake server's, which every connection of the app opens.
  openSocket: OpenLiveSocket;
  // None when left out.
  friends?: readonly Friend[];
};

// The whole app at `path` for `reader`, on a clock stopped at 0, its connection on the fake server.
export const renderAppFor = async (path: string, { reader, openSocket, friends = [] }: AppFor) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  const queryClient = cacheFor(reader, friends);

  const router = createAppRouter({
    history,
    storage: () => localStorage,
    languages: [],
    queryClient,
  });

  // Every page's code loaded first: a test that goes to one never waits for its chunk.
  await Promise.all(Object.values(router.routesById).map((route) => router.loadRouteChunk(route)));
  await act(() => router.load());
  render(
    <QueryClientProvider client={queryClient}>
      <LiveSocketContext value={openSocket}>
        <ClockContext value={() => 0}>
          <RouterProvider router={router} />
        </ClockContext>
      </LiveSocketContext>
    </QueryClientProvider>,
  );
  await screen.findByLabelText(/^(Barre latérale|Sidebar)$/);

  return { history, router, url: () => history.location.pathname, user: userEvent.setup() };
};

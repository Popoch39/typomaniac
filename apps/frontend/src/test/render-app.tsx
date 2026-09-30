import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { defaultPace } from "typing-engine";

import { type Activity, activityQueryOptions } from "@/api/activity";
import { type BestRun, bestRunQueryOptions, type RunSetting } from "@/api/best-run";
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
import { durations, wordCounts } from "@/stores/settings-store";

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

// A Best Run the reader holds, and the setting it is of.
export type HeldBestRun = { setting: RunSetting; bestRun: NonNullable<BestRun> };

// Every setting the app offers, each Language.
const OFFERED_SETTINGS: readonly RunSetting[] = (["fr", "en"] as const).flatMap((language) =>
  durations
    .map((length): RunSetting => ({ mode: "time", length, language }))
    .concat(wordCounts.map((length): RunSetting => ({ mode: "words", length, language }))),
);

// What the reader's cache holds besides them, each left out an empty one.
type Held = {
  friends: readonly Friend[];
  bestRuns: readonly HeldBestRun[];
  activities: readonly Activity[];
};

// The cache as the root route's beforeLoad leaves it, for `reader` and their `friends`, or for a
// Visitor; a User holds `bestRuns`, and none on the other settings.
const cacheFor = (reader: Me | null, { friends, bestRuns, activities }: Held) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
  });

  queryClient.setQueryData(meQueryOptions.queryKey, reader);
  queryClient.setQueryData(paceQueryOptions(reader).queryKey, defaultPace);
  queryClient.setQueryData(friendsQueryOptions.queryKey, [...friends]);
  // What /friends, /leaderboard and /duels load, and Jouer's live zones: nothing yet unless given.
  queryClient.setQueryData(friendRequestsQueryOptions.queryKey, { received: [], sent: [] });
  queryClient.setQueryData(activityQueryOptions.queryKey, [...activities]);
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

  if (reader !== null) {
    for (const setting of OFFERED_SETTINGS) {
      queryClient.setQueryData(bestRunQueryOptions(setting).queryKey, null);
    }

    for (const { setting, bestRun } of bestRuns) {
      queryClient.setQueryData(bestRunQueryOptions(setting).queryKey, bestRun);
    }
  }

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
  // The reader's Best Runs, none when left out.
  bestRuns?: readonly HeldBestRun[];
  // Their Friends' Activity, none when left out.
  activities?: readonly Activity[];
};

// The whole app at `path` for `reader`, on a clock stopped at 0 until the test moves it, its
// connection on the fake server.
export const renderAppFor = async (
  path: string,
  { reader, openSocket, friends = [], bestRuns = [], activities = [] }: AppFor,
) => {
  let now = 0;
  const clock = () => now;
  const history = createMemoryHistory({ initialEntries: [path] });
  const queryClient = cacheFor(reader, { friends, bestRuns, activities });

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
        <ClockContext value={clock}>
          <RouterProvider router={router} />
        </ClockContext>
      </LiveSocketContext>
    </QueryClientProvider>,
  );
  await screen.findByLabelText(/^(Barre latérale|Sidebar)$/);

  return {
    history,
    router,
    url: () => history.location.pathname,
    user: userEvent.setup(),
    // Moves the tab's clock to `at` ms: the next frame reads it.
    clockAt: (at: number) => {
      now = at;
    },
  };
};

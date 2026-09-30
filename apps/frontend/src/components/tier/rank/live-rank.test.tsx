import { QueryClient, QueryClientProvider, type QueryKey } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ServerMessage } from "api";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { type LeaderboardSearch, leaderboardQueryOptions } from "@/api/leaderboard";
import { meQueryOptions } from "@/api/me";
import { LiveRank } from "@/components/tier/rank/live-rank";
import { useConnectionStore } from "@/stores/connection-store";
import { fakeServer, idle } from "@/test/fake-socket";

const noResult = {
  wpm: 0,
  raw: 0,
  accuracy: 0,
  consistency: 0,
  chars: { correct: 0, incorrect: 0, extra: 0, missed: 0 },
};

const noScore = { score: 0, bestCombo: 0, bursts: 0 };

const gold = (tp: number) => ({ tier: "gold" as const, division: 2 as const, tp, shielded: false });

// The end of a Duel: a Ranked one moves the rank, a Challenge (`ranked` null) nothing.
const duelEnded = (ranked: Extract<ServerMessage, { type: "duel-ended" }>["ranked"]) => ({
  type: "duel-ended" as const,
  duelId: "duel-1",
  ranked,
  outcome: "win" as const,
  forfeit: false,
  result: noResult,
  opponentResult: noResult,
  score: noScore,
  opponentScore: noScore,
  opponent: { handle: "alan", image: null, ornament: null },
});

let sockets = fakeServer();

beforeEach(() => {
  sockets = fakeServer();
  useConnectionStore.getState().open(sockets.open);
  sockets.server().receive(idle());
});

afterEach(() => {
  useConnectionStore.getState().close();
});

const firstPage: LeaderboardSearch = {};

const readerPage: LeaderboardSearch = { at: "me" };

const emptyLeaderboard = {
  entries: [],
  me: null,
  firstPlace: 1,
  lastPlace: 0,
  total: 0,
  previous: null,
  next: null,
};

// `LiveRank` over a cache where the User and two pages of the Leaderboard are already read.
const renderLiveRank = () => {
  const queryClient = new QueryClient();

  queryClient.setQueryData(meQueryOptions.queryKey, null);
  queryClient.setQueryData(leaderboardQueryOptions(firstPage).queryKey, emptyLeaderboard);
  queryClient.setQueryData(leaderboardQueryOptions(readerPage).queryKey, emptyLeaderboard);

  render(
    <QueryClientProvider client={queryClient}>
      <LiveRank />
    </QueryClientProvider>,
  );

  return (queryKey: QueryKey) => queryClient.getQueryState(queryKey)?.isInvalidated;
};

describe("LiveRank", () => {
  test("reads the User and every page of the Leaderboard again once a Ranked Duel ends", () => {
    const invalidated = renderLiveRank();

    sockets.server().receive(duelEnded({ tp: 18, previousRank: gold(24), rank: gold(42) }));

    expect(invalidated(meQueryOptions.queryKey)).toBe(true);
    expect(invalidated(leaderboardQueryOptions(firstPage).queryKey)).toBe(true);
    expect(invalidated(leaderboardQueryOptions(readerPage).queryKey)).toBe(true);
  });

  test("leaves them be after a Challenge", () => {
    const invalidated = renderLiveRank();

    sockets.server().receive(duelEnded(null));

    expect(invalidated(meQueryOptions.queryKey)).toBe(false);
    expect(invalidated(leaderboardQueryOptions(firstPage).queryKey)).toBe(false);
  });
});

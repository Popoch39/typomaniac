import { Value } from "@sinclair/typebox/value";
import { createFileRoute } from "@tanstack/react-router";

import {
  leaderboardQueryOptions,
  type LeaderboardSearch,
  LeaderboardSearchSchema,
  onePageOf,
} from "@/api/leaderboard";
import { meQueryOptions } from "@/api/me";
import { LeaderboardPage } from "@/pages/leaderboard-page";
import { LeaderboardPendingPage } from "@/pages/leaderboard-pending-page";

// The Leaderboard, the page in the URL (`?after=`, `?before=`, `?at=me`). A Visitor stays, invited
// to sign in: nothing to load for them (the API answers 401).
export const Route = createFileRoute("/leaderboard")({
  validateSearch: (search): LeaderboardSearch =>
    Value.Check(LeaderboardSearchSchema, search) ? onePageOf(search) : {},
  beforeLoad: async ({ context }) => ({
    signedIn: (await context.queryClient.ensureQueryData(meQueryOptions)) !== null,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.signedIn
      ? context.queryClient.ensureQueryData(leaderboardQueryOptions(deps))
      : undefined,
  component: LeaderboardPage,
  pendingComponent: LeaderboardPendingPage,
});

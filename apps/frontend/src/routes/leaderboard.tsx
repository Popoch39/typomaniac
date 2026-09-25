import { createFileRoute } from "@tanstack/react-router";

import { leaderboardQueryOptions } from "@/api/leaderboard";
import { meQueryOptions } from "@/api/me";
import { LeaderboardPage } from "@/pages/leaderboard-page";
import { LeaderboardPendingPage } from "@/pages/leaderboard-pending-page";

// The Classement. A Visitor stays, invited to sign in: nothing to load for them (the API answers
// 401).
export const Route = createFileRoute("/leaderboard")({
  beforeLoad: async ({ context }) => ({
    signedIn: (await context.queryClient.ensureQueryData(meQueryOptions)) !== null,
  }),
  loader: ({ context }) =>
    context.signedIn ? context.queryClient.ensureQueryData(leaderboardQueryOptions) : undefined,
  component: LeaderboardPage,
  pendingComponent: LeaderboardPendingPage,
});

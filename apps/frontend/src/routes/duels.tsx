import { createFileRoute, redirect } from "@tanstack/react-router";

import { duelHistoryQueryOptions } from "@/api/duel-history";
import { meQueryOptions } from "@/api/me";
import { DuelsPage } from "@/pages/duels-page";
import { DuelsPendingPage } from "@/pages/duels-pending-page";

// A Visitor has no Duels: back to the home page.
export const Route = createFileRoute("/duels")({
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(duelHistoryQueryOptions),
  component: DuelsPage,
  pendingComponent: DuelsPendingPage,
});

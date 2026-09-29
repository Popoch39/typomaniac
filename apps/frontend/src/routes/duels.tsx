import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { duelHistoryQueryOptions } from "@/api/duel-history";
import { meQueryOptions } from "@/api/me";
import { DuelsPage } from "@/pages/duels-page";
import { DuelsPendingPage } from "@/pages/duels-pending-page";

const DuelsSearchSchema = Type.Object({
  // The chosen Duel of the Duel history, by id: the most recent one without it.
  duel: Type.Optional(Type.String({ maxLength: 200 })),
});

// A Visitor has no Duels: back to the home page.
export const Route = createFileRoute("/duels")({
  validateSearch: (search): typeof DuelsSearchSchema.static =>
    Value.Check(DuelsSearchSchema, search) ? { duel: search.duel } : {},
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(duelHistoryQueryOptions),
  component: DuelsPage,
  pendingComponent: DuelsPendingPage,
});

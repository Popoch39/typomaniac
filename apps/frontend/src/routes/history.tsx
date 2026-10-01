import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { loadHistory } from "@/components/history/load-history";
import { HistoryPage } from "@/pages/history-page";
import { HistoryPendingPage } from "@/pages/history-pending-page";

const HistorySearchSchema = Type.Object({
  // The week shown, by its Monday (`2026-09-28`): the current one without it.
  week: Type.Optional(Type.String({ maxLength: 10 })),
});

// The signed-in User's History, a week at a time. A Visitor has no Duels: back to the home page.
export const Route = createFileRoute("/history")({
  validateSearch: (search): typeof HistorySearchSchema.static =>
    Value.Check(HistorySearchSchema, search) ? { week: search.week } : {},
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  loaderDeps: ({ search }) => ({ week: search.week }),
  // The week and its frieze, read at the time of the load: the page never reads the clock.
  loader: ({ context, deps }) => loadHistory(context.queryClient, deps.week, Date.now()),
  component: HistoryPage,
  pendingComponent: HistoryPendingPage,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

import { replayedDuelQueryOptions } from "@/api/duel-history";
import { meQueryOptions } from "@/api/me";
import { ReplayErrorPage } from "@/pages/replay-error-page";
import { ReplayPage } from "@/pages/replay-page";

// Beside the Duel history, not inside it: the Replay takes the whole page. A Visitor has no Duels:
// back to the home page.
export const Route = createFileRoute("/duels_/$duelId")({
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(replayedDuelQueryOptions(params.duelId)),
  component: ReplayPage,
  errorComponent: ReplayErrorPage,
});

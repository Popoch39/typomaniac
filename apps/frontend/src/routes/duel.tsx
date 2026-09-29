import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { DuelPage } from "@/pages/duel-page";

// A Visitor plays no Duel: back to the play page. A User without a Duel to resume goes back there
// too, once the server told their place (DuelScreen).
export const Route = createFileRoute("/duel")({
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  component: DuelPage,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

import { meQueryOptions } from "@/api/me";
import { FriendsPage } from "@/pages/friends-page";

// A Visitor has no Friends: back to the home page.
export const Route = createFileRoute("/friends")({
  beforeLoad: async ({ context }) => {
    if ((await context.queryClient.ensureQueryData(meQueryOptions)) === null) {
      throw redirect({ to: "/" });
    }
  },
  component: FriendsPage,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

import { friendRequestsQueryOptions, friendsQueryOptions } from "@/api/friends";
import { meQueryOptions } from "@/api/me";
import { FriendsPage } from "@/pages/friends-page";
import { FriendsPendingPage } from "@/pages/friends-pending-page";

// A Visitor has no Friends: back to the home page. A User without a Handle has none yet: nothing
// to load for them.
export const Route = createFileRoute("/friends")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQueryOptions);

    if (me === null) {
      throw redirect({ to: "/" });
    }

    return { hasHandle: me.handle !== null };
  },
  loader: async ({ context }) => {
    if (context.hasHandle) {
      await Promise.all([
        context.queryClient.ensureQueryData(friendsQueryOptions),
        context.queryClient.ensureQueryData(friendRequestsQueryOptions),
      ]);
    }
  },
  component: FriendsPage,
  pendingComponent: FriendsPendingPage,
});

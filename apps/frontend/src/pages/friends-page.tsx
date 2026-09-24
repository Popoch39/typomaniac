import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { FriendsHandleRequired } from "@/components/friends/friends-handle-required";
import { FriendsOverview } from "@/components/friends/friends-overview";

// Where a User finds the others by their Handle, answers their Friend requests and sees their
// Friends.
export const FriendsPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  // The route sends a Visitor away; signing out here leaves an empty page until they leave.
  if (me === null) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 py-12">
      <h1 className="text-lg font-bold">Friends</h1>
      {me.handle === null ? <FriendsHandleRequired /> : <FriendsOverview />}
    </section>
  );
};

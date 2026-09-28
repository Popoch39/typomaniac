import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { FriendsHandleRequired } from "@/components/friends/friends-handle-required";
import { FriendsHeader } from "@/components/friends/friends-header";
import { FriendsOverview } from "@/components/friends/friends-overview";
import { cn } from "cn";

// Where a User finds the others by their Handle, answers their Friend requests and sees their
// Friends.
export const FriendsPage = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  // The route sends a Visitor away; signing out here leaves an empty page until they leave.
  if (me === null) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      <FriendsHeader />
      <div className={cn("w-full", me.handle === null ? "max-w-md" : "max-w-4xl")}>
        {me.handle === null ? <FriendsHandleRequired /> : <FriendsOverview />}
      </div>
    </section>
  );
};

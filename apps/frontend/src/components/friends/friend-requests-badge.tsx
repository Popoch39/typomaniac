import { useQuery } from "@tanstack/react-query";

import { friendRequestsQueryOptions } from "@/api/friends";

// The number of Friend requests waiting for the User's answer, on the way to the Friends. Nothing
// while it loads, fails, or when none waits: the header never waits for it.
export const FriendRequestsBadge = () => {
  const { data: count = 0 } = useQuery({
    ...friendRequestsQueryOptions,
    select: (requests) => requests.received.length,
  });

  return count > 0 ? (
    <span
      aria-label={`${count} Friend requests en attente`}
      className="min-w-4 bg-caret px-1 text-center text-[0.65rem] leading-4 font-bold text-background tabular-nums"
    >
      {count}
    </span>
  ) : null;
};

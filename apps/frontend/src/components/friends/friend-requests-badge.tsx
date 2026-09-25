import { useConnectionStore } from "@/stores/connection-store";

// The number of Friend requests waiting for the User's answer, on the way to the Friends, as the
// real-time connection keeps it. Nothing until it is told, or when none waits: the header never
// waits for it.
export const FriendRequestsBadge = () => {
  const count = useConnectionStore((store) => store.friends?.requestsReceived ?? 0);

  return count > 0 ? (
    <span
      aria-label={`${count} Friend requests en attente`}
      className="min-w-4 bg-caret px-1 text-center text-[0.65rem] leading-4 font-bold text-background font-mono tabular-nums"
    >
      {count}
    </span>
  ) : null;
};

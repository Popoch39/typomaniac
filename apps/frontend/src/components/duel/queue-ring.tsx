import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

// The User's avatar, with their Ornament, in the middle of the search: an accent arc turns around
// it, a dashed halo turns slowly the other way. Still under reduced motion. The avatar never holds up the page.
export const QueueRing = () => {
  const { data: me } = useQuery(meQueryOptions);

  return (
    <div aria-hidden className="relative flex size-56 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-surface-2 motion-safe:animate-queue-halo" />
      <div className="absolute size-40 rounded-full border-6 border-surface-2 border-t-primary motion-safe:animate-queue-arc" />
      <UserAvatar
        handle={me?.handle ?? ""}
        image={me?.image ?? null}
        ornament={me?.ornament ?? null}
        className="size-21 rounded-[33%] text-2xl font-extrabold"
        fallbackClassName="bg-primary text-2xl font-extrabold text-primary-foreground"
      />
    </div>
  );
};

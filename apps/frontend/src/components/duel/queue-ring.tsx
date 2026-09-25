import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

// The User's avatar in the middle of the search: an accent arc turns around it, a dashed halo
// turns slowly the other way. Still under reduced motion. The avatar never holds up the page.
export const QueueRing = () => {
  const { data: me } = useQuery(meQueryOptions);
  const handle = me?.handle ?? "";

  return (
    <div aria-hidden className="relative flex size-56 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-surface-2 motion-safe:animate-queue-halo" />
      <div className="absolute size-40 rounded-full border-6 border-surface-2 border-t-primary motion-safe:animate-queue-arc" />
      <Avatar className="size-21 rounded-[33%] text-2xl font-extrabold">
        {me?.image ? <AvatarImage src={me.image} alt="" /> : null}
        <AvatarFallback className="bg-primary text-2xl font-extrabold text-primary-foreground">
          {initials(handle)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

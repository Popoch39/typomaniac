import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";

import { meQueryOptions } from "@/api/me";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type QueueRingProps = {
  // In the Queue pill: 56 px, the same ring scaled down, as the search folds into it.
  compact?: boolean;
};

// The User's avatar, with their Ornament, in the middle of the search, 156 px: an accent arc turns
// around it on its track, a dotted halo turns slowly the other way. Still under reduced motion.
// The avatar never holds up the page.
export const QueueRing = ({ compact = false }: QueueRingProps) => {
  const { data: me } = useQuery(meQueryOptions);

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex size-39 shrink-0 items-center justify-center",
        compact && "-m-12.5 scale-[0.359]",
      )}
    >
      {/* The wrappers turn, not the SVGs: a transformed div stays on the compositor. */}
      <div className="absolute inset-0 motion-safe:animate-queue-halo">
        <svg viewBox="0 0 156 156" className="size-full">
          <circle
            cx="78"
            cy="78"
            r="75"
            fill="none"
            strokeWidth="1.5"
            strokeDasharray="2 8"
            className="stroke-faint"
          />
        </svg>
      </div>
      <svg viewBox="0 0 156 156" className="absolute inset-0 size-full">
        <circle
          cx="78"
          cy="78"
          r="60"
          fill="none"
          strokeWidth="5"
          className="stroke-foreground/10"
        />
      </svg>
      <div className="absolute inset-0 motion-safe:animate-queue-arc">
        <svg viewBox="0 0 156 156" className="size-full">
          <circle
            cx="78"
            cy="78"
            r="60"
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="96 281"
            transform="rotate(-70 78 78)"
            className="stroke-primary"
          />
        </svg>
      </div>
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

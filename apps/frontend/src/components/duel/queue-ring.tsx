import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { useRef } from "react";

import { meQueryOptions } from "@/api/me";
import { useQueueRingSpin } from "@/components/duel/use-queue-ring-spin";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

type QueueRingProps = {
  // In the Queue pill: 56 px, the same ring scaled down, as the search folds into it.
  compact?: boolean;
};

// The User's avatar, with their Ornament, in the middle of the search, 156 px: an accent arc turns
// around it on its track, a dotted halo turns slowly the other way. The ring and the avatar are one
// element (`data-search-ring`), which follows the search from one form to the other. The avatar
// never holds up the page.
export const QueueRing = ({ compact = false }: QueueRingProps) => {
  const { data: me } = useQuery(meQueryOptions);
  const ringRef = useRef<HTMLDivElement>(null);

  useQueueRingSpin(ringRef);

  return (
    <div
      ref={ringRef}
      aria-hidden
      data-search-ring
      data-flip-id="search-ring"
      className={cn("relative shrink-0", compact ? "size-14" : "size-39")}
    >
      <div
        className={cn(
          "absolute top-0 left-0 flex size-39 items-center justify-center",
          compact && "origin-top-left scale-[0.359]",
        )}
      >
        {/* The wrappers turn, not the SVGs: a transformed div stays on the compositor. */}
        <div data-ring-halo className="absolute inset-0">
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
        <div data-ring-arc className="absolute inset-0">
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
    </div>
  );
};

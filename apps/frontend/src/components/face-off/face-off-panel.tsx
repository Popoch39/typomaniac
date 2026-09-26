import { cn } from "cn";
import type { ReactNode } from "react";
import type { Tier } from "ranked";

import { FaceOffMarquee } from "@/components/face-off/face-off-marquee";
import type { RunTone } from "@/components/run/run-tone";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { atHandle } from "@/lib/at-handle";

type FaceOffPanelProps = {
  side: RunTone;
  // Null while this User's is being read: the panel comes in without it.
  handle: string | null;
  image: string | null;
  // The Ornament the player wears around their avatar: it rises in and leaves with it.
  ornament: Tier | null;
  children?: ReactNode;
};

// Each side's half of the screen, cut on the diagonal (a static clip-path: only the panel's
// transform moves), filled with the player's colour.
const SIDES = {
  own: {
    cut: "bg-caret [clip-path:polygon(0_0,54%_0,46%_100%,0_100%)]",
    content: "left-24 items-start text-left",
    initials: "text-caret",
    reversed: false,
  },
  opponent: {
    cut: "bg-opponent-caret [clip-path:polygon(54%_0,100%_0,100%_100%,46%_100%)]",
    content: "right-24 items-end text-right",
    initials: "text-opponent-caret",
    reversed: true,
  },
};

// One player in the Face-off, in ink on their colour: their Handle sliding behind, then their
// avatar (their initials without one), their Handle and what the side adds, risen in after the
// impact.
export const FaceOffPanel = ({ side, handle, image, ornament, children }: FaceOffPanelProps) => {
  const style = SIDES[side];

  return (
    <div data-face-off={side} className="absolute inset-0">
      <div className={cn("absolute inset-0 overflow-hidden", style.cut)}>
        <FaceOffMarquee handle={handle} reversed={style.reversed} />
        <div
          data-face-off="reveal"
          className={cn(
            "invisible absolute inset-y-0 flex max-w-[38%] flex-col justify-center gap-5.5 text-background opacity-0",
            style.content,
          )}
        >
          <UserAvatar
            handle={handle ?? ""}
            image={image}
            ornament={ornament}
            className="size-44 after:border-0"
            fallbackClassName={cn("bg-background text-6xl font-extrabold", style.initials)}
          />
          {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
          <p className="relative max-w-full truncate text-7xl leading-none font-extrabold tracking-[-0.02em]">
            {handle === null ? null : atHandle(handle)}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
};

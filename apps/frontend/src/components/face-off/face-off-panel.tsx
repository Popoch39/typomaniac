import { cn } from "cn";
import type { ReactNode } from "react";

import type { RunTone } from "@/components/run/run-tone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { atHandle } from "@/lib/at-handle";
import { initials } from "@/lib/initials";

type FaceOffPanelProps = {
  side: RunTone;
  // Null while this User's is being read: the panel comes in without it.
  handle: string | null;
  image: string | null;
  children?: ReactNode;
};

// Each side's half of the screen, cut on the diagonal (a static clip-path: only its transform
// moves), in the player's colour.
const SIDES = {
  own: {
    panel: "justify-start pl-[7%] [clip-path:polygon(0_0,58%_0,42%_100%,0_100%)]",
    tint: "bg-linear-to-r from-primary/30 via-primary/10 to-transparent",
    content: "items-start text-left",
    accent: "text-caret",
    ring: "ring-primary",
    fallback: "bg-primary text-primary-foreground",
  },
  opponent: {
    panel: "justify-end pr-[7%] [clip-path:polygon(58%_0,100%_0,100%_100%,42%_100%)]",
    tint: "bg-linear-to-l from-opponent-caret/30 via-opponent-caret/10 to-transparent",
    content: "items-end text-right",
    accent: "text-opponent-caret",
    ring: "ring-opponent-caret",
    fallback: "bg-opponent-caret text-background",
  },
};

// One player in the Face-off: their avatar (their initials without one), their Handle, then what
// the side adds, each revealed in turn after the impact.
export const FaceOffPanel = ({ side, handle, image, children }: FaceOffPanelProps) => {
  const style = SIDES[side];

  return (
    <div
      data-face-off={side}
      className={cn("absolute inset-0 flex items-center bg-background", style.panel)}
    >
      <div aria-hidden className={cn("absolute inset-0", style.tint)} />
      <div className={cn("relative flex max-w-[36%] flex-col gap-6", style.content)}>
        <div data-face-off="reveal">
          <Avatar className={cn("size-40 ring-4 after:border-0", style.ring)}>
            {image ? <AvatarImage src={image} alt="" /> : null}
            <AvatarFallback className={cn("text-5xl font-extrabold", style.fallback)}>
              {handle === null ? null : initials(handle)}
            </AvatarFallback>
          </Avatar>
        </div>
        <p
          data-face-off="reveal"
          className={cn("max-w-full truncate text-6xl font-extrabold", style.accent)}
        >
          {handle === null ? null : atHandle(handle)}
        </p>
        {children ? <div data-face-off="reveal">{children}</div> : null}
      </div>
    </div>
  );
};

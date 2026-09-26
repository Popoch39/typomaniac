import type { ComponentProps } from "react";
import type { Tier } from "ranked";

import { TierOrnament } from "@/components/tier/tier-ornament";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";
import { cn } from "cn";

type UserAvatarProps = {
  handle: string;
  image: string | null;
  // The Ornament the User wears, as the API resolved it: none in Placement or by choice.
  ornament?: Tier | null;
  size?: ComponentProps<typeof Avatar>["size"];
  className?: string;
  // The initials' own look, where the avatar stands out: colour, weight, type size.
  fallbackClassName?: string;
};

// A User's avatar: their image, or the initials of their Handle without one. Their Ornament lies
// behind it, centred and twice its size: it never catches the pointer nor moves the layout. Too
// small to read in the small size, where it is never worn.
export const UserAvatar = ({
  handle,
  image,
  ornament,
  size,
  className,
  fallbackClassName,
}: UserAvatarProps) => {
  const worn = size === "sm" ? null : ornament;

  return (
    <Avatar size={size} className={cn(worn ? "isolate" : null, className)}>
      {worn ? (
        <span
          data-ornament
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[200%] -translate-1/2"
        >
          <TierOrnament tier={worn} />
        </span>
      ) : null}
      {image ? <AvatarImage src={image} alt="" /> : null}
      <AvatarFallback className={fallbackClassName}>{initials(handle)}</AvatarFallback>
    </Avatar>
  );
};

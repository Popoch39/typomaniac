import type { ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

type UserAvatarProps = {
  handle: string;
  image: string | null;
  size?: ComponentProps<typeof Avatar>["size"];
  className?: string;
  // The initials' own look, where the avatar stands out: colour, weight, type size.
  fallbackClassName?: string;
};

// A User's avatar: their image, or the initials of their Handle without one.
export const UserAvatar = ({
  handle,
  image,
  size,
  className,
  fallbackClassName,
}: UserAvatarProps) => (
  <Avatar size={size} className={className}>
    {image ? <AvatarImage src={image} alt="" /> : null}
    <AvatarFallback className={fallbackClassName}>{initials(handle)}</AvatarFallback>
  </Avatar>
);

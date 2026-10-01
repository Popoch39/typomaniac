import { cn } from "cn";
import type { Tier } from "ranked";

import { UserAvatar } from "@/components/user-avatar/user-avatar";

type RoundBreakPlayerProps = {
  // Their name as the header shows it: « Toi », or the opponent's Handle.
  name: string;
  // Their Handle for the initials; null while this User's is not read yet.
  handle: string | null;
  image: string | null;
  ornament: Tier | null;
  // The opponent's side: the name before the avatar.
  mirrored: boolean;
};

// One player in the Round break's header: their avatar with its Ornament, and their name.
export const RoundBreakPlayer = ({
  name,
  handle,
  image,
  ornament,
  mirrored,
}: RoundBreakPlayerProps) => (
  <div className={cn("flex items-center gap-3.5", mirrored && "flex-row-reverse")}>
    <UserAvatar
      handle={handle ?? name}
      image={image}
      ornament={ornament}
      className="size-13"
      fallbackClassName={cn(
        "font-display text-[22px] font-extrabold",
        mirrored ? "bg-opponent text-on-opponent" : "bg-brand text-on-brand",
      )}
    />
    <div className="relative font-display text-[22px] font-bold">{name}</div>
  </div>
);

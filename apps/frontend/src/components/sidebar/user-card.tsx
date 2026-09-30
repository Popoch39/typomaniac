import { useId } from "react";

import type { Me } from "@/api/me";
import { UserCardMenu } from "@/components/sidebar/user-card-menu";
import { UserCardRank } from "@/components/sidebar/user-card-rank";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { cn } from "cn";

// At the bottom of the sidebar, the User on every page, the whole card the button of their menu:
// the medallion (the avatar and their Ornament, held in the card), their Handle, then their rank,
// their Place in the Leaderboard and the rank's progress, which describe the button. `LiveRank`
// reads the User again after a Ranked Duel.
export const UserCard = ({ me }: { me: Me }) => {
  // The Handle as everywhere else, the name until one is chosen: the card and its initials.
  const shownName = me.handle ?? me.name;
  const rankId = useId();

  return (
    <UserCardMenu
      me={me}
      side="top"
      aria-describedby={me.rank ? rankId : undefined}
      // Its surface lifted by 5 % of the text on hover and while the menu is open, as a secondary
      // button's.
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-[20px] bg-sidebar-accent py-3 pr-2.5 pl-3 text-left transition-colors outline-none hover:bg-[color-mix(in_oklch,var(--sidebar-accent),var(--foreground)_5%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring aria-expanded:bg-[color-mix(in_oklch,var(--sidebar-accent),var(--foreground)_5%)]"
    >
      {/* The Ornament twice the avatar fills the medallion; without one, the avatar alone, larger. */}
      <span className="flex size-16 shrink-0 items-center justify-center">
        <UserAvatar
          handle={shownName}
          image={me.image}
          ornament={me.ornament}
          className={me.ornament ? "size-8" : "size-11"}
          fallbackClassName={cn("font-bold text-foreground", me.ornament ? "text-xs" : "text-sm")}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.25">
        <span className="truncate text-[15px] font-extrabold">{shownName}</span>
        {me.rank ? <UserCardRank id={rankId} rank={me.rank} place={me.place} /> : null}
      </span>
    </UserCardMenu>
  );
};

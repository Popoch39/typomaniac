import type { Me } from "@/api/me";
import { UserCardMenu } from "@/components/sidebar/user-card-menu";
import { RankChip } from "@/components/tier/rank/rank-chip";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

// At the bottom of the sidebar, the User on every page: avatar with their Ornament, Handle, rank
// and its progress, then their menu. `LiveRank` reads the User again after a Ranked Duel.
export const UserCard = ({ me }: { me: Me }) => {
  // The Handle as everywhere else, the name until one is chosen: the card and its initials.
  const shownName = me.handle ?? me.name;

  return (
    <div className="flex items-center gap-2.5 rounded-[20px] bg-sidebar-accent py-2.5 pr-0.5 pl-2.5">
      <UserAvatar
        handle={shownName}
        image={me.image}
        ornament={me.ornament}
        size="lg"
        className="size-10"
      />
      {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-0.75">
        <p className="truncate text-sm font-bold">{shownName}</p>
        {me.rank ? <RankChip rank={me.rank} /> : null}
        <TpProgress rank={me.rank} />
      </div>
      <UserCardMenu me={me} />
    </div>
  );
};

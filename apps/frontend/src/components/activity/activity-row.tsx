import type { ReactNode } from "react";
import type { Tier } from "ranked";

import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { relativeTime } from "@/lib/relative-time";
import { useLocale } from "@/locale/use-locale";

type ActivityRowProps = {
  // The Friend it is about: their avatar, with their Ornament, leads the row.
  friend: { handle: string; image: string | null; ornament: Tier | null };
  at: number;
  now: number;
  // Before how long ago, on the line under: a Duel's wpm.
  meta?: string;
  children: ReactNode;
};

// One Activity: the Friend's avatar, what happened, then under it in Martian Mono its figures and
// how long ago, short, in the Locale.
export const ActivityRow = ({ friend, at, now, meta, children }: ActivityRowProps) => {
  const locale = useLocale();

  return (
    <li className="flex items-start gap-3 px-2.5 py-3">
      <UserAvatar
        handle={friend.handle}
        image={friend.image}
        ornament={friend.ornament}
        className="size-8"
        fallbackClassName="bg-surface-2 text-xs font-extrabold text-foreground"
      />
      {/* Positioned after the avatar: drawn over the Ornament's overflow, never under it. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-0.75">
        <p className="text-sm leading-[1.35]">{children}</p>
        <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {meta === undefined ? null : `${meta} · `}
          <time dateTime={new Date(at).toISOString()}>
            {relativeTime(at, now, locale, "short")}
          </time>
        </p>
      </div>
    </li>
  );
};

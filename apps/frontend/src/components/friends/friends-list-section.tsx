import { cn } from "cn";
import { type ReactNode, useId } from "react";

import { FRIENDS_CARD_PAINT, FRIENDS_TITLE_PAINT } from "@/components/friends/friends-paint";

type FriendsListSectionProps = {
  // Its name and its count.
  title: ReactNode;
  isEmpty: boolean;
  // Shown instead of the list when it is empty.
  empty: ReactNode;
  children: ReactNode;
};

// A titled list of Users on the Friends page, on its card.
export const FriendsListSection = ({
  title,
  isEmpty,
  empty,
  children,
}: FriendsListSectionProps) => {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
      <h2 id={titleId} className={cn("flex items-center gap-2 tabular-nums", FRIENDS_TITLE_PAINT)}>
        {title}
      </h2>
      {isEmpty ? empty : <ul className={FRIENDS_CARD_PAINT}>{children}</ul>}
    </section>
  );
};

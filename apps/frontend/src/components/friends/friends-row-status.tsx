import { cn } from "cn";
import type { ReactNode } from "react";

type FriendsRowStatusProps = {
  // The dot's colour, where the status has one: a Presence, a request pending.
  dot?: string;
  children: ReactNode;
};

// The line under a Handle on a row of the Friends page: a dot, then a word or two.
export const FriendsRowStatus = ({ dot, children }: FriendsRowStatusProps) => (
  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
    {dot === undefined ? null : (
      <span aria-hidden className={cn("size-[7px] shrink-0 rounded-full", dot)} />
    )}
    {children}
  </span>
);

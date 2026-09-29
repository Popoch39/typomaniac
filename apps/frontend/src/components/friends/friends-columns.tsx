import type { ReactNode } from "react";

type FriendsColumnsProps = { lists: ReactNode; activity: ReactNode };

// The Friends page's two columns: the search and the lists on the width left, then the Activity,
// 400 px at the right.
export const FriendsColumns = ({ lists, activity }: FriendsColumnsProps) => (
  <div className="flex items-start gap-7">
    <div className="flex min-w-0 flex-1 flex-col gap-5">{lists}</div>
    <div className="flex w-100 shrink-0 flex-col">{activity}</div>
  </div>
);

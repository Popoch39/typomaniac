import type { ReactNode } from "react";

type FriendsColumnsProps = { lists: ReactNode; activity: ReactNode };

// The Friends page's two columns under its header, the height the window leaves: the tabs on the
// width left, then the Activity, 380 px at the right. Each card scrolls on its own, never the page.
export const FriendsColumns = ({ lists, activity }: FriendsColumnsProps) => (
  <div className="flex min-h-96 flex-[1_1_0px] gap-7">
    <div className="flex min-w-0 flex-1 flex-col">{lists}</div>
    <div className="flex w-95 shrink-0 flex-col">{activity}</div>
  </div>
);

import type { ReactNode } from "react";

type LeaderboardColumnsProps = { standings: ReactNode; aside: ReactNode };

// The Classement's two columns: the standings on the width left, then 300 px at the right.
export const LeaderboardColumns = ({ standings, aside }: LeaderboardColumnsProps) => (
  <div className="flex items-start gap-6">
    <div className="flex min-w-0 flex-1 flex-col gap-5">{standings}</div>
    <div className="flex w-75 shrink-0 flex-col gap-4">{aside}</div>
  </div>
);

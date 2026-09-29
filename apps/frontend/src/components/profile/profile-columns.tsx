import type { ReactNode } from "react";

type ProfileColumnsProps = { stats: ReactNode; settings: ReactNode };

// Under the hero of `/profile`, its two columns: the Stats on the width left, then the settings,
// 320 px at the right.
export const ProfileColumns = ({ stats, settings }: ProfileColumnsProps) => (
  <div className="flex items-start gap-6">
    <div className="flex min-w-0 flex-1 flex-col gap-6">{stats}</div>
    <div className="flex w-80 shrink-0 flex-col gap-5">{settings}</div>
  </div>
);

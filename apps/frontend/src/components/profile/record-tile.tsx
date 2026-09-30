import type { ReactNode } from "react";

import { profileFigure } from "@/components/profile/profile-figure";
import { useLocale } from "@/locale/use-locale";

type RecordTileProps = { icon: ReactNode; term: string; value: number | null };

// One of the User's Records, on its tile: its icon in the accent, its name, then its value (a dash
// for a Record never set). On a grid, the icon over both rows: a `dl`'s group holds its term and its
// value directly.
export const RecordTile = ({ icon, term, value }: RecordTileProps) => {
  const locale = useLocale();

  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4.5 gap-y-1 rounded-[24px] bg-card px-6.5 py-5.5">
      <span className="row-span-2 flex size-14 items-center justify-center rounded-[19px] bg-surface-2 text-caret">
        {icon}
      </span>
      <dt className="self-end text-sm text-muted-foreground">{term}</dt>
      <dd className="self-start font-mono text-[32px] leading-none font-bold tracking-[-0.04em] tabular-nums">
        {profileFigure(value, locale)}
      </dd>
    </div>
  );
};

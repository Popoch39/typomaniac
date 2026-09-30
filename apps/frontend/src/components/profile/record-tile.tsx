import { cn } from "cn";
import type { ReactNode } from "react";

import { PROFILE_TILE_PAINT } from "@/components/profile/profile-card-paint";
import { profileFigure } from "@/components/profile/profile-figure";
import { useLocale } from "@/locale/use-locale";

type RecordTileProps = { icon: ReactNode; term: string; value: number | null };

// One of the User's Records, on its tile of the bento: its icon in the accent at the top, then at
// the foot its name and its value (a dash for a Record never set), the value as large as the tile's
// width allows. A `dl`'s group holds its term and its value directly: the icon is laid on the grid
// beside them, not in a wrapper.
export const RecordTile = ({ icon, term, value }: RecordTileProps) => {
  const locale = useLocale();

  return (
    <div
      className={cn(
        "grid grid-rows-[1fr_auto_auto] gap-1 rounded-[24px] px-5 py-5",
        PROFILE_TILE_PAINT,
      )}
    >
      <span className="flex size-12 items-center justify-center self-start rounded-[16px] bg-surface-2 text-caret">
        {icon}
      </span>
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="font-mono text-[clamp(1.25rem,20cqi,2rem)] leading-none font-bold tracking-[-0.04em] tabular-nums">
        {profileFigure(value, locale)}
      </dd>
    </div>
  );
};

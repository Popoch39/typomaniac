import type { Tier } from "ranked";

import type { OrnamentOption as Option } from "@/components/ornament/ornament-options";
import { OrnamentPreview } from "@/components/ornament/ornament-preview";
import { cn } from "cn";

type OrnamentOptionProps = {
  name: string;
  option: Option;
  // The Tier « Suivre mon Tier » wears, for its preview.
  followedTier: Tier | null;
  checked: boolean;
  locked: boolean;
  onChoose: () => void;
};

// One option of the picker, a native radio (arrow keys, focus and locking for free) under its
// tile: its preview, then its name. Chosen, the tile is tinted and ringed in the accent; locked,
// it is hollow, a padlock in place of its preview, and cannot be chosen.
export const OrnamentOption = ({
  name,
  option,
  followedTier,
  checked,
  locked,
  onChoose,
}: OrnamentOptionProps) => (
  <label className={cn("relative", locked ? "cursor-not-allowed" : "cursor-pointer")}>
    <input
      type="radio"
      name={name}
      value={option.choice}
      checked={checked}
      disabled={locked}
      onChange={onChoose}
      className="peer sr-only"
    />
    <span className="flex flex-col items-center gap-2 rounded-[18px] bg-surface-2 px-1 pt-3 pb-2.5 text-center text-[11.5px] font-semibold text-muted-foreground transition-colors peer-checked:bg-primary/16 peer-checked:text-foreground peer-checked:inset-ring-[1.5px] peer-checked:inset-ring-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-enabled:hover:text-foreground peer-disabled:bg-transparent peer-disabled:text-faint peer-disabled:inset-ring peer-disabled:inset-ring-border">
      <OrnamentPreview option={option} followedTier={followedTier} locked={locked} />
      {option.label}
    </span>
  </label>
);

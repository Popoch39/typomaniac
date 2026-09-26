import { LockIcon } from "lucide-react";

import type { OrnamentOption as Option } from "@/components/ornament/ornament-options";
import { TierOrnament } from "@/components/tier/tier-ornament";
import { cn } from "cn";

type OrnamentOptionProps = {
  name: string;
  option: Option;
  checked: boolean;
  locked: boolean;
  onChoose: () => void;
};

// One option of the picker, a native radio (arrow keys, focus and locking for free) under its
// tile: a Tier's Ornament in preview, named by its Tier, or a choice in words. Locked, it is
// greyed out with a padlock and cannot be chosen.
export const OrnamentOption = ({
  name,
  option,
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
    <span
      className={cn(
        "flex h-14 items-center justify-center rounded-xl border-2 border-transparent bg-surface-2 text-xs font-semibold text-muted-foreground transition-colors peer-checked:border-primary peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:opacity-40 peer-enabled:hover:text-foreground",
        option.tier === null ? "px-3" : "w-14",
      )}
    >
      {option.tier === null ? (
        option.label
      ) : (
        <>
          <span className="size-9">
            <TierOrnament tier={option.tier} />
          </span>
          <span className="sr-only">{option.label}</span>
        </>
      )}
    </span>
    {locked && option.tier !== null ? (
      <LockIcon aria-hidden className="absolute right-1 bottom-1 size-3.5 text-foreground" />
    ) : null}
  </label>
);

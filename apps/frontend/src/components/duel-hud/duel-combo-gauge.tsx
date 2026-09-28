import { cn } from "cn";

// The pips of the Combo gauge: 4 words to ×2, then 5 to ×3, then 5 to ×4.
const GROUPS = [4, 5, 5] as const;

const PIPS = GROUPS.reduce((total, group) => total + group, 0);

// One pip, or the multiplier mark that closes its group.
type GaugeItem =
  | { kind: "pip"; key: string; lit: boolean }
  | { kind: "mark"; key: string; multiplier: number; reached: boolean };

const itemsOf = (combo: number, multiplier: number) => {
  const items: GaugeItem[] = [];
  let pip = 0;

  for (const [group, size] of GROUPS.entries()) {
    for (let k = 0; k < size; k++) {
      items.push({ kind: "pip", key: `pip-${pip}`, lit: combo > pip });
      pip++;
    }

    const mark = group + 2;

    items.push({
      kind: "mark",
      key: `mark-${mark}`,
      multiplier: mark,
      reached: multiplier >= mark,
    });
  }

  return items;
};

type DuelComboGaugeProps = {
  combo: number;
  // What the word in progress will be paid times: the marks up to it are reached.
  multiplier: number;
  // The opponent's, drawn from right to left.
  mirrored: boolean;
};

// A player's Combo in the band, as its board draws it: one pip lit in ink per right word in a row,
// each group closed by the multiplier it unlocks, full once reached. Screen readers read how many
// pips are lit, out of the 14.
export const DuelComboGauge = ({ combo, multiplier, mirrored }: DuelComboGaugeProps) => {
  const items = itemsOf(combo, multiplier);

  return (
    <div className={cn("flex items-center gap-[3px]", mirrored && "flex-row-reverse")}>
      <meter
        aria-label="Combo"
        min={0}
        max={PIPS}
        value={Math.min(combo, PIPS)}
        className="sr-only"
      />
      {items.map((item) =>
        item.kind === "pip" ? (
          <span
            key={item.key}
            aria-hidden="true"
            className={cn(
              "block h-4 w-2 shrink-0 rounded-[2px]",
              mirrored ? "skew-x-16" : "-skew-x-16",
              item.lit ? "bg-ink" : "bg-ink/20",
            )}
          />
        ) : (
          <span
            key={item.key}
            aria-hidden="true"
            className={cn(
              "mx-[3px] font-display text-[10px] leading-none font-extrabold",
              item.reached ? "text-ink" : "text-ink/40",
            )}
          >
            ×{item.multiplier}
          </span>
        ),
      )}
    </div>
  );
};

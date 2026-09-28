import { cn } from "cn";
import { useRef } from "react";

import { brokenTimeline } from "@/components/duel-hud/band-effect-timelines";
import type { BandEffects } from "@/components/duel-hud/band-effects";
import { DuelComboPip } from "@/components/duel-hud/duel-combo-pip";
import { useCueTimeline } from "@/components/duel-hud/use-cue-timeline";

// The pips of the Combo gauge: 4 words to ×2, then 5 to ×3, then 5 to ×4.
const GROUPS = [4, 5, 5] as const;

const PIPS = GROUPS.reduce((total, group) => total + group, 0);

// One pip, or the multiplier mark that closes its group. The last pip lit is the one a right
// word punches, unless the Combo is past the gauge.
type GaugeItem =
  | { kind: "pip"; key: string; lit: boolean; last: boolean }
  | { kind: "mark"; key: string; multiplier: number; reached: boolean };

const itemsOf = (combo: number, multiplier: number) => {
  const items: GaugeItem[] = [];
  let pip = 0;

  for (const [group, size] of GROUPS.entries()) {
    for (let k = 0; k < size; k++) {
      items.push({ kind: "pip", key: `pip-${pip}`, lit: combo > pip, last: combo === pip + 1 });
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
  effects: Pick<BandEffects, "pipPunch" | "broken">;
  startsAt: number;
};

// A player's Combo in the band, as its board draws it: one pip lit in ink per right word in a row,
// each group closed by the multiplier it unlocks, full once reached. The pip a right word lights
// punches, and a broken Combo turns every pip red, fading on the Duel's clock (under reduced
// motion too: it is a colour). Screen readers read how many pips are lit, out of the 14.
export const DuelComboGauge = ({
  combo,
  multiplier,
  mirrored,
  effects,
  startsAt,
}: DuelComboGaugeProps) => {
  const gaugeRef = useRef<HTMLDivElement>(null);
  const items = itemsOf(combo, multiplier);
  const broken = effects.broken !== null;

  useCueTimeline(gaugeRef, { at: effects.broken, startsAt }, () =>
    gaugeRef.current === null
      ? null
      : brokenTimeline([...gaugeRef.current.querySelectorAll("[data-combo-broken]")]),
  );

  return (
    <div
      ref={gaugeRef}
      className={cn("flex items-center gap-[3px]", mirrored && "flex-row-reverse")}
    >
      <meter
        aria-label="Combo"
        min={0}
        max={PIPS}
        value={Math.min(combo, PIPS)}
        className="sr-only"
      />
      {items.map((item) =>
        item.kind === "pip" ? (
          <DuelComboPip
            key={item.key}
            lit={item.lit}
            mirrored={mirrored}
            punchAt={item.last ? effects.pipPunch : null}
            broken={broken}
            startsAt={startsAt}
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

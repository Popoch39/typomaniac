import { cn } from "cn";

import type { TpBar } from "@/components/duel-end/rank-card";

// What the Duel moved: gained in the accent, lost hatched.
const MOVES = {
  gained: "bg-brand",
  lost: "bg-[repeating-linear-gradient(135deg,var(--pending)_0_3px,var(--surface-2)_3px_6px)]",
};

// The Division's quarters, cut in the card's colour.
const TICKS = ["left-1/4", "left-1/2", "left-3/4"];

// The TP of the Division out of 100, 16 px high: what was kept faint in the accent, then what the
// Duel moved. Only seen: the TP are written beside it.
export const DuelEndTpTrack = ({ bar }: { bar: TpBar }) => (
  <div
    aria-hidden="true"
    data-tp-bar
    className="relative h-4 overflow-hidden rounded-[6px] bg-surface-2"
  >
    <span
      data-tp-part="kept"
      className="absolute inset-y-0 bg-brand/40"
      style={{ left: "0%", width: `${bar.kept}%` }}
    />
    <span
      data-tp-part={bar.move}
      className={cn("absolute inset-y-0 origin-left", MOVES[bar.move])}
      style={{ left: `${bar.from}%`, width: `${bar.width}%` }}
    />
    {TICKS.map((tick) => (
      <span key={tick} className={cn("absolute inset-y-0 w-0.5 bg-card", tick)} />
    ))}
  </div>
);

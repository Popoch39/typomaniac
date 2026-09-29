import { useRef } from "react";

import { useInkFade } from "@/components/duel-hud/use-ink-fade";

// How long a mark takes to change colour, in seconds, as on the board.
const TONE_S = 0.2;

// The multiplier mark that closes a group of a Combo gauge, as its board draws it: in its half's
// ink once reached, faint before, its colour changing in 200 ms.
export const DuelComboMark = ({
  multiplier,
  reached,
}: {
  multiplier: number;
  reached: boolean;
}) => {
  const markRef = useRef<HTMLSpanElement>(null);
  const tone = reached ? 1 : 0.4;

  useInkFade(markRef, tone, TONE_S);

  return (
    <span
      ref={markRef}
      aria-hidden="true"
      style={{ opacity: tone }}
      className="mx-[3px] font-display text-[10px] leading-none font-extrabold"
    >
      ×{multiplier}
    </span>
  );
};

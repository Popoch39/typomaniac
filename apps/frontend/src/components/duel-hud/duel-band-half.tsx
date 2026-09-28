import { cn } from "cn";
import type { ScoreState } from "typing-engine";

import type { BandEffects } from "@/components/duel-hud/band-effects";
import { DuelBandAvatar } from "@/components/duel-hud/duel-band-avatar";
import { DuelComboGauge } from "@/components/duel-hud/duel-combo-gauge";
import { DuelMultiplier } from "@/components/duel-hud/duel-multiplier";
import { DuelScorePop } from "@/components/duel-hud/duel-score-pop";
import { atHandle } from "@/lib/at-handle";

type DuelBandHalfProps = {
  // What screen readers call the player: « Toi », or the opponent's Handle.
  name: string;
  // Null while this User's is not read yet.
  handle: string | null;
  score: ScoreState;
  // What their last Keystrokes still play, on the Duel's clock from `startsAt`, GO.
  effects: BandEffects;
  startsAt: number;
  // The opponent's, on the right, as the mirror of this User's.
  mirrored: boolean;
};

// One player's half of the band, in ink over whatever colour lies under it: their initials, their
// Handle, their multiplier and Combo gauge, and their Score with the « +N » of their last word.
export const DuelBandHalf = ({
  name,
  handle,
  score,
  effects,
  startsAt,
  mirrored,
}: DuelBandHalfProps) => (
  <section
    aria-label={name}
    className={cn(
      "absolute inset-y-0 flex items-center gap-4 text-ink",
      mirrored ? "right-[26px] flex-row-reverse" : "left-[26px]",
    )}
  >
    <DuelBandAvatar handle={handle} tone={mirrored ? "opponent" : "own"} />
    <div className={cn("flex flex-col gap-[9px]", mirrored && "items-end")}>
      <span className="font-display text-[18px] leading-none font-extrabold whitespace-nowrap">
        {handle === null ? null : atHandle(handle)}
      </span>
      <div className={cn("flex items-center gap-2.5", mirrored && "flex-row-reverse")}>
        <DuelMultiplier
          multiplier={score.multiplier}
          punchAt={effects.multiplierPunch}
          startsAt={startsAt}
        />
        <DuelComboGauge
          combo={score.combo}
          multiplier={score.multiplier}
          mirrored={mirrored}
          effects={effects}
          startsAt={startsAt}
        />
      </div>
    </div>
    <div className={cn("relative", mirrored ? "mr-2.5" : "ml-2.5")}>
      <span className="font-display text-[50px] leading-none font-bold tracking-[-0.02em]">
        <span className="sr-only">Score </span>
        {score.score}
      </span>
      {effects.pop === null ? null : (
        <DuelScorePop pop={effects.pop} startsAt={startsAt} mirrored={mirrored} />
      )}
    </div>
  </section>
);

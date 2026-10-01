import { cn } from "cn";
import type { ReactNode } from "react";

type DuelEndScoreSideProps = {
  name: string;
  score: string;
  // The opponent's side, on the right, in the ink set on their colour.
  opponent?: boolean;
  // Set beside the Score: this User's Record stamp.
  stamp?: ReactNode;
  // In a Bo3's band, as high as the HUD's: smaller.
  compact?: boolean;
};

// One player's half of the band: their name at the top, their Score huge at the foot.
export const DuelEndScoreSide = ({
  name,
  score,
  opponent = false,
  stamp = null,
  compact = false,
}: DuelEndScoreSideProps) => (
  <div
    className={cn(
      "flex flex-col justify-between font-display",
      opponent ? "items-end text-on-opponent" : "text-on-brand",
    )}
  >
    <span className={cn("font-bold tracking-[0.08em] uppercase", compact ? "text-sm" : "text-lg")}>
      {name}
    </span>
    <div className="flex items-end gap-[18px]">
      <span
        className={cn(
          "leading-[0.85] font-black tracking-[-0.03em]",
          compact ? "text-[60px]" : "text-[112px]",
        )}
      >
        {score}
      </span>
      {stamp}
    </div>
  </div>
);

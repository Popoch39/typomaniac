import { cn } from "cn";
import type { ReactNode } from "react";

type DuelEndScoreSideProps = {
  name: string;
  score: string;
  // The opponent's side, on the right, in the ink set on their colour.
  opponent?: boolean;
  // Set beside the Score: this User's Record stamp.
  stamp?: ReactNode;
};

// One player's half of the band: their name at the top, their Score huge at the foot.
export const DuelEndScoreSide = ({
  name,
  score,
  opponent = false,
  stamp = null,
}: DuelEndScoreSideProps) => (
  <div
    className={cn(
      "flex flex-col justify-between font-display",
      opponent ? "items-end text-on-opponent" : "text-on-brand",
    )}
  >
    <span className="text-lg font-bold tracking-[0.08em] uppercase">{name}</span>
    <div className="flex items-end gap-[18px]">
      <span className="text-[112px] leading-[0.85] font-black tracking-[-0.03em]">{score}</span>
      {stamp}
    </div>
  </div>
);

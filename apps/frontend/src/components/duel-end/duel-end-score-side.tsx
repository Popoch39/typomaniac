import { cn } from "cn";

type DuelEndScoreSideProps = {
  name: string;
  score: string;
  // The opponent's side, on the right, in the ink set on their colour.
  opponent?: boolean;
};

// One player's half of the band: their name at the top, their Score huge at the foot.
export const DuelEndScoreSide = ({ name, score, opponent = false }: DuelEndScoreSideProps) => (
  <div
    className={cn(
      "flex flex-col justify-between font-display",
      opponent ? "items-end text-on-opponent" : "text-on-brand",
    )}
  >
    <span className="text-lg font-bold tracking-[0.08em] uppercase">{name}</span>
    <span className="text-[112px] leading-[0.85] font-black tracking-[-0.03em]">{score}</span>
  </div>
);

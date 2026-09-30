import type { TapeSide } from "@/components/duel-end/tape-lines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Points to the best value from its own side: rightwards on the User's, leftwards on the
// opponent's, in their colour (a class: `var()` does not work in an SVG presentation attribute).
const ARROWS = {
  mine: { path: "M0 0 L12 7 L0 14 Z", fill: "fill-brand" },
  theirs: { path: "M12 0 L0 7 L12 14 Z", fill: "fill-opponent" },
};

// The mark of a line's best value, named « meilleur ».
export const DuelEndTapeBest = ({ side }: { side: TapeSide }) => {
  const locale = useLocale();

  return (
    <span className="flex">
      <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14">
        <path d={ARROWS[side].path} className={ARROWS[side].fill} />
      </svg>
      <span className="sr-only">{m.duel_ended_best({}, { locale })}</span>
    </span>
  );
};

import { RoundBreakCountFigure } from "@/components/round-break/round-break-count-figure";
import type { RoundCount } from "@/components/round-break/round-break-view";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The count of the Rounds won, as the board draws it: this User's figure in the accent, the
// opponent's in their blue, a dash between, on a pill. Read out whole.
export const RoundBreakCount = ({ count }: { count: RoundCount }) => {
  const locale = useLocale();

  return (
    <div className="flex items-center gap-4 rounded-full bg-card px-[26px] py-2 font-display text-[56px] leading-none font-black">
      <span className="sr-only">
        {m.round_break_count({ self: count.self, opponent: count.opponent }, { locale })}
      </span>
      <RoundBreakCountFigure value={count.self} jumps={count.jumps === "self"} tone="text-brand" />
      <div className="text-[36px] text-faint" aria-hidden>
        —
      </div>
      <RoundBreakCountFigure
        value={count.opponent}
        jumps={count.jumps === "opponent"}
        tone="text-opponent"
      />
    </div>
  );
};

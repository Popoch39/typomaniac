import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under the cards: the next Round, its Text shown at GO; or, at 1-1, the deciding Round.
export const RoundBreakCaption = ({
  nextNumber,
  deciding,
}: {
  nextNumber: number;
  deciding: boolean;
}) => {
  const locale = useLocale();

  return (
    <div data-rb="caption" className="flex flex-col items-center gap-2 whitespace-nowrap">
      <div className="font-display text-[28px] font-extrabold tracking-[0.04em] uppercase">
        {deciding
          ? m.round_break_deciding_title({}, { locale })
          : m.round_break_round_n({ n: nextNumber }, { locale })}
      </div>
      <div className="text-base text-muted-foreground">
        {deciding
          ? m.round_break_deciding_sub({}, { locale })
          : m.round_break_reveal({}, { locale })}
      </div>
    </div>
  );
};

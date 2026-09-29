import { type DuelFormat, duelFormatLine } from "@/components/duel/duel-format-line";
import { useLocale } from "@/locale/use-locale";

// The Duel's format at the right of the Duel's scene's header, read from the Duel played: a
// Challenge is never ranked.
export const DuelFormatChip = ({ format }: { format: DuelFormat }) => {
  const locale = useLocale();

  return (
    <p className="rounded-full bg-card px-3.5 py-2 text-[13px] leading-[normal] font-medium text-muted-foreground">
      {duelFormatLine(format, locale)}
    </p>
  );
};

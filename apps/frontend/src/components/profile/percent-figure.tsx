import { profileFigure } from "@/components/profile/profile-figure";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A share of the Stats, large, on a card of the Profile: the figure in Martian Mono, the sign smaller
// and quieter, where the Locale puts it (« 58 % », "58%"); a dash without one.
export const PercentFigure = ({ value }: { value: number | null }) => {
  const locale = useLocale();

  const figure = (
    <span className="text-[80px] font-bold tracking-[-0.06em] text-foreground">
      {profileFigure(value, locale)}
    </span>
  );

  return (
    <p className="font-mono text-[36px] leading-[0.85] text-muted-foreground tabular-nums">
      {value === null
        ? figure
        : withSlots((marks) => m.format_percent({ value: marks.figure }, { locale }), { figure })}
    </p>
  );
};

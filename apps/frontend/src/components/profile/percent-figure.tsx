import { profileFigure } from "@/components/profile/profile-figure";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// A share of the Stats, large, on a card of the Profile: the figure in Martian Mono, the sign smaller
// and quieter, in Onest, where the Locale puts it (« 58 % », "58%"); a dash without one.
// The figure's tight tracking also follows its last digit: its right margin gives that back, and a
// little air, so the sign never touches it. The sign's space is Onest's: Martian Mono's, a whole
// character wide, would open a hole in French.
export const PercentFigure = ({ value }: { value: number | null }) => {
  const locale = useLocale();

  const figure = (
    <span className="mr-[0.1em] font-mono text-[80px] font-bold tracking-[-0.06em] text-foreground tabular-nums">
      {profileFigure(value, locale)}
    </span>
  );

  return (
    <p className="text-[36px] leading-[0.85] font-semibold text-muted-foreground">
      {value === null
        ? figure
        : withSlots((marks) => m.format_percent({ value: marks.figure }, { locale }), { figure })}
    </p>
  );
};

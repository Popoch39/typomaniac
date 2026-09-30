import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The last Callout, once the time is up: the end, where the Callouts go, as a big tilted pill in
// the text's colour, under the ground's. Still: it stays until the Duel end, which tells the
// outcome.
export const DuelEndCallout = () => {
  const locale = useLocale();

  return (
    <span className="inline-flex rotate-[-2deg] rounded-full bg-foreground px-[18px] py-2.5 font-display text-[21px] leading-none font-extrabold whitespace-nowrap text-ink">
      {m.hud_time_up({}, { locale })}
    </span>
  );
};

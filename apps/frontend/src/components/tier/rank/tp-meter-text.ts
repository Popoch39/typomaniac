import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What screen readers read on a Division's TP meter, in the Locale: "42 TP sur 100 · 58 TP avant
// Gold I", with what is left to the next rank as its meter words it.
export const divisionMeterText = (tp: number, of: number, toNext: string, locale: Locale) => {
  const numbers = numberFormat(locale);

  return m.tp_progress_division_value(
    { tp: numbers.format(tp), of: numbers.format(of), toNext },
    { locale },
  );
};

// What screen readers read on the Placement meter, in the Locale: "3 Duels de Placement joués sur 5".
export const placementMeterText = (played: number, of: number, locale: Locale) => {
  const numbers = numberFormat(locale);

  return m.tp_progress_placement_value(
    { count: played, played: numbers.format(played), of: numbers.format(of) },
    { locale },
  );
};

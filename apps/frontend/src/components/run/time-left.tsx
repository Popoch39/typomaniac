import { RunCounter } from "@/components/run/run-counter";
import { useTimeLeft } from "@/components/run/use-time-left";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Seconds left in a `time` Run, e.g. `29`.
export const TimeLeft = ({ seconds }: { seconds: number }) => {
  const locale = useLocale();
  const left = useTimeLeft(seconds);

  return (
    <RunCounter role="timer" aria-label={m.run_time_left({}, { locale })}>
      {numberFormat(locale).format(left)}
    </RunCounter>
  );
};

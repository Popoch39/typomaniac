import { useSecondsLeft } from "@/components/match-proposal/use-seconds-left";
import { secondsLabel } from "@/lib/durations";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// On the Queue pill: the seconds left to answer the Match proposal, « 10 s ».
export const QueuePillCountdown = ({ expiresAt }: { expiresAt: number }) => {
  const locale = useLocale();
  const left = useSecondsLeft(expiresAt);

  return (
    <span
      role="timer"
      aria-label={m.proposal_time_left_label({}, { locale })}
      className="shrink-0 font-mono text-lg font-bold tabular-nums"
    >
      {secondsLabel(left, locale)}
    </span>
  );
};

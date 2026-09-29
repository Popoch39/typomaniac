import { useSecondsLeft } from "@/components/challenge/use-seconds-left";
import { secondsLabel } from "@/lib/durations";
import { useLocale } from "@/locale/use-locale";

type ChallengeTimeLeftProps = {
  expiresAt: number;
};

// The seconds a Challenge has left for its answer: only this re-renders every second.
export const ChallengeTimeLeft = ({ expiresAt }: ChallengeTimeLeftProps) => {
  const left = useSecondsLeft(expiresAt);
  const locale = useLocale();

  return (
    <span className="text-muted-foreground font-mono tabular-nums">
      {secondsLabel(left, locale)}
    </span>
  );
};

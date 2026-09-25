import { useSecondsLeft } from "@/components/challenge/use-seconds-left";

type ChallengeTimeLeftProps = {
  expiresAt: number;
};

// The seconds a Challenge has left for its answer: only this re-renders every second.
export const ChallengeTimeLeft = ({ expiresAt }: ChallengeTimeLeftProps) => {
  const left = useSecondsLeft(expiresAt);

  return <span className="text-muted-foreground font-mono tabular-nums">{left} s</span>;
};

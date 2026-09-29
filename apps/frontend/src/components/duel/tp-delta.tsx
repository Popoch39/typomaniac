import { cn } from "cn";

import { signedTp } from "@/components/tier/rank/rank-label";
import { useLocale } from "@/locale/use-locale";

// The TP a ranked Duel moved, signed, popping in.
export const TpDelta = ({ tp }: { tp: number }) => {
  const locale = useLocale();

  return (
    <p
      className={cn(
        "font-mono text-4xl font-bold tabular-nums motion-safe:animate-tp-pop",
        tp >= 0 ? "text-primary" : "text-muted-foreground",
      )}
    >
      {signedTp(tp, locale)}
    </p>
  );
};

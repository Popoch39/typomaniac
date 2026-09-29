import { HandleLink } from "@/components/handle/handle-link";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

type OpponentHandleProps = { opponent: { handle: string } | null; className?: string };

// The opponent of a finished Duel: their Handle leads to their Profile, a deleted User to nothing.
export const OpponentHandle = ({ opponent, className }: OpponentHandleProps) => {
  const locale = useLocale();

  return opponent ? (
    <HandleLink handle={opponent.handle} className={className} />
  ) : (
    <span className={cn("text-muted-foreground", className)}>
      {m.opponent_deleted({}, { locale })}
    </span>
  );
};

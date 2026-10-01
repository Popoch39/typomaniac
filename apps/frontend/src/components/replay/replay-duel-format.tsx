import type { ReplayedDuel } from "@/api/duel-history";
import { duelFormatLine } from "@/components/duel/duel-format-line";
import { DuelTime } from "@/components/duel-history/duel-time";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under the title of the Replay: when the Duel was played, what kind of Duel it was, its time and
// its Language, in the Locale: « 27 sept. 2026, 21:14 · Duel classé · 30 s · anglais ».
export const ReplayDuelFormat = ({ duel }: { duel: ReplayedDuel }) => {
  const locale = useLocale();

  const format = duelFormatLine(
    {
      challenge: !duel.ranked,
      bo3: duel.roundsToWin > 1,
      seconds: duel.seconds,
      language: duel.language,
    },
    locale,
  );

  return (
    <p className="text-[13px] text-muted-foreground">
      {withSlots((marks) => m.replay_duel_format({ ...marks, format }, { locale }), {
        date: <DuelTime endedAt={duel.endedAt} />,
      })}
    </p>
  );
};

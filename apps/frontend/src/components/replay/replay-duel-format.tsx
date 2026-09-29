import type { ReplayedDuel } from "@/api/duel-history";
import { duelKind } from "@/components/duel-history/duel-kind";
import { DuelTime } from "@/components/duel-history/duel-time";
import { languageName } from "@/lib/language-names";
import { useLocale } from "@/locale/use-locale";

// Under the title of the Replay: when the Duel was played, what kind of Duel it was, its time and
// its Language, « 27 sept. 2026, 21:14 · Duel classé · 30 s · anglais ».
export const ReplayDuelFormat = ({ duel }: { duel: ReplayedDuel }) => {
  const locale = useLocale();

  return (
    <p className="text-[13px] text-muted-foreground">
      <DuelTime endedAt={duel.endedAt} /> · {duelKind(duel.ranked)} · {duel.seconds} s ·{" "}
      {languageName(duel.language, locale)}
    </p>
  );
};

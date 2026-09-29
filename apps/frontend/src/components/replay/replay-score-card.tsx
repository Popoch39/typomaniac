import { duelNumber } from "@/components/duel-history/duel-number";
import type { ReplaySide } from "@/components/replay/replay-sides";
import { ReplayStat } from "@/components/replay/replay-stat";
import type { RunTone } from "@/components/run/run-tone";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

// Each side in its player's colour: its dot, its Score, and the ring once its Run shows.
const paints: Record<RunTone, { dot: string; score: string; ring: string }> = {
  own: { dot: "bg-caret", score: "text-caret", ring: "inset-ring-caret" },
  opponent: {
    dot: "bg-opponent-caret",
    score: "text-opponent-caret",
    ring: "inset-ring-opponent-caret",
  },
};

type ReplayScoreCardProps = {
  name: string;
  // What names the card: whose Score it is, in the Locale.
  label: string;
  tone: RunTone;
  side: ReplaySide;
  // Their Run is the one on the Text.
  shown: boolean;
};

// One side of the Duel at the Replay's instant: their Score, wpm and Combo, as the engine rebuilds
// them. « — » for the Score and the Combo of a Duel played before the Score.
export const ReplayScoreCard = ({ name, label, tone, side, shown }: ReplayScoreCardProps) => {
  const locale = useLocale();
  const paint = paints[tone];

  return (
    <section
      aria-label={label}
      className={cn(
        "flex items-center justify-between gap-4 rounded-[24px] bg-card px-6 py-4",
        shown && ["inset-ring-[1.5px]", paint.ring],
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold">
        <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", paint.dot)} />
        <span className="truncate">{name}</span>
      </span>
      <dl className="flex gap-6.5">
        <ReplayStat term={m.run_stat_score({}, { locale })} className={paint.score}>
          {duelNumber(side.score?.score ?? null, locale)}
        </ReplayStat>
        <ReplayStat term={m.run_stat_wpm({}, { locale })}>
          {duelNumber(side.wpm, locale)}
        </ReplayStat>
        <ReplayStat term={m.run_stat_combo({}, { locale })}>
          {duelNumber(side.score?.combo ?? null, locale)}
        </ReplayStat>
      </dl>
    </section>
  );
};

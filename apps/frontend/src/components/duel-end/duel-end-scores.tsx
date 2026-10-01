import { cn } from "cn";
import type { CSSProperties } from "react";

import { DuelEndScoreFills } from "@/components/duel-end/duel-end-score-fills";
import { DuelEndScoreRecord } from "@/components/duel-end/duel-end-score-record";
import { DuelEndScoreSide } from "@/components/duel-end/duel-end-score-side";
import { scoreShare } from "@/components/duel-end/score-share";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The slant's place is a CSS variable, not in React's CSSProperties type.
type ShareStyle = CSSProperties & { "--share": number };

type DuelEndScoresProps = {
  // What the band is: both Scores, or in a Bo3 the Rounds each won.
  label: string;
  score: number;
  opponentScore: number;
  opponent: string;
  // The Duel beat this User's best Score: stamped beside it.
  record: boolean;
  // A Bo3's screen, which holds without scrolling: the band as high as the HUD's.
  compact?: boolean;
};

// Both Scores in one band, or in a Bo3 the count of the Rounds won, in large: this User's on the
// accent at the left, the opponent's in their colour at the right, split by a slant at this User's
// share of both.
export const DuelEndScores = ({
  label,
  score,
  opponentScore,
  opponent,
  record,
  compact = false,
}: DuelEndScoresProps) => {
  const locale = useLocale();
  const share: ShareStyle = { "--share": scoreShare(score, opponentScore) };

  return (
    <section
      aria-label={label}
      data-entrance="band"
      style={share}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-card bg-opponent",
        compact ? "h-24" : "h-60",
      )}
    >
      <DuelEndScoreFills />
      <div
        data-band-figures
        className={cn(
          "relative flex h-full items-stretch justify-between",
          compact ? "px-9 py-3" : "px-11 py-8",
        )}
      >
        <DuelEndScoreSide
          name={m.duel_self({}, { locale })}
          score={numberFormat(locale).format(score)}
          stamp={record ? <DuelEndScoreRecord /> : null}
          compact={compact}
        />
        <DuelEndScoreSide
          name={opponent}
          score={numberFormat(locale).format(opponentScore)}
          opponent
          compact={compact}
        />
      </div>
    </section>
  );
};

import type { CSSProperties } from "react";

import { DuelEndScoreFills } from "@/components/duel-end/duel-end-score-fills";
import { DuelEndScoreSide } from "@/components/duel-end/duel-end-score-side";
import { scoreShare } from "@/components/duel-end/score-share";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The slant's place is a CSS variable, not in React's CSSProperties type.
type ShareStyle = CSSProperties & { "--share": number };

type DuelEndScoresProps = { score: number; opponentScore: number; opponent: string };

// Both Scores in one band: this User's on the accent at the left, the opponent's in their colour
// at the right, split by a slant at this User's share of both.
export const DuelEndScores = ({ score, opponentScore, opponent }: DuelEndScoresProps) => {
  const locale = useLocale();
  const share: ShareStyle = { "--share": scoreShare(score, opponentScore) };

  return (
    <section
      aria-label={m.duel_ended_scores({}, { locale })}
      style={share}
      className="relative h-60 overflow-hidden rounded-card bg-opponent"
    >
      <DuelEndScoreFills />
      <div className="relative flex h-full items-stretch justify-between px-11 py-8">
        <DuelEndScoreSide
          name={m.duel_self({}, { locale })}
          score={numberFormat(locale).format(score)}
        />
        <DuelEndScoreSide
          name={opponent}
          score={numberFormat(locale).format(opponentScore)}
          opponent
        />
      </div>
    </section>
  );
};

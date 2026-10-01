import { Link } from "@tanstack/react-router";

import type { DuelHistoryEntry } from "@/api/duel-history";
import { outcomeHeadline } from "@/components/duel/outcome-headlines";
import { duelNumber } from "@/components/duel-history/duel-number";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { HistoryDuelMeta } from "@/components/history/history-duel-meta";
import { HistoryDuelSpark } from "@/components/history/history-duel-spark";
import { HistoryDuelTp } from "@/components/history/history-duel-tp";
import { CARD_HOVER_PAINT } from "@/components/history/history-paint";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { cn } from "cn";

// A Duel of the week: how it ended and the TP it moved, the opponent and when, both wpm lines, both
// Scores, and the way to its Replay.
export const HistoryDuelCard = ({ duel }: { duel: DuelHistoryEntry }) => {
  const locale = useLocale();

  return (
    <li
      className={cn(
        // 24 px as the board: `rounded-3xl` follows `--radius`, 26.4 px.
        "flex flex-col gap-3.5 rounded-[24px] bg-card px-5 pt-4.5 pb-4 transition-colors",
        CARD_HOVER_PAINT,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[22px] font-extrabold tracking-[-0.01em]",
            duel.outcome === "win" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {outcomeHeadline(duel.outcome, locale)}
        </span>
        <HistoryDuelTp tp={duel.tp} ranked={duel.ranked} />
      </div>
      <div className="flex items-center gap-2.5">
        {/* A deleted User has no Handle left: « ? » stands in for their initials. */}
        <UserAvatar
          handle={duel.opponent?.handle ?? "?"}
          image={duel.opponent?.image ?? null}
          className="size-8"
          fallbackClassName="bg-surface-2 text-xs font-bold text-foreground"
        />
        <span className="flex min-w-0 flex-col">
          <OpponentHandle opponent={duel.opponent} className="truncate text-[15px] font-bold" />
          <HistoryDuelMeta endedAt={duel.endedAt} ranked={duel.ranked} forfeit={duel.forfeit} />
        </span>
      </div>
      <HistoryDuelSpark
        wpmBySecond={duel.wpmBySecond}
        opponentWpmBySecond={duel.opponentWpmBySecond}
      />
      <div className="flex items-center justify-between font-journal-mono text-sm">
        <span>
          <span className="font-medium text-caret">{duelNumber(duel.score, locale)}</span>{" "}
          <span className="text-faint">{m.history_card_versus({}, { locale })}</span>{" "}
          <span className="text-opponent-caret">{duelNumber(duel.opponentScore, locale)}</span>
        </span>
        <Link
          to="/history/$duelId"
          params={{ duelId: duel.id }}
          className="py-2.5 font-journal text-sm font-bold text-primary no-underline hover:text-[color-mix(in_srgb,var(--brand)_60%,var(--text))]"
        >
          {m.history_card_replay({}, { locale })}
        </Link>
      </div>
    </li>
  );
};

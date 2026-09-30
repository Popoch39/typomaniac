import { cn } from "cn";

import { tpTone } from "@/components/duel-history/tp-tone";
import type { DuelActivity } from "@/components/play/friends-live-rows";
import { RematchButton } from "@/components/play/rematch-button";
import { signedTp } from "@/components/tier/rank/rank-label";
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { RowHandle } from "@/components/play/row-handle";
import { RowSentence } from "@/components/play/row-sentence";
import { relativeTime } from "@/lib/relative-time";
import { numberFormat } from "@/locale/formats";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type FriendDuelRowProps = {
  activity: DuelActivity;
  // The reader: a Duel a Friend won against them is said to them.
  readerId: string;
  // Whether that Friend is online, to be challenged back.
  friendOnline: boolean;
  now: number;
};

// What the Friend did, by the Duel's outcome from their side.
const SENTENCES = {
  win: m.play_friends_duel_win,
  loss: m.play_friends_duel_loss,
  draw: m.play_friends_duel_draw,
} satisfies Record<DuelActivity["friend"]["outcome"], typeof m.play_friends_duel_win>;

// One of a Friend's last Duels, on one line: « @mia a gagné un Duel · +18 TP · il y a 5 min »; the
// TP of a Ranked Duel only. Beaten by them, the User reads « @axel t'a battu · 97 – 94 », and
// « Revanche ? » while they are online. The date gives way first to the width, then the figures.
export const FriendDuelRow = ({ activity, readerId, friendOnline, now }: FriendDuelRowProps) => {
  const locale = useLocale();
  const { friend, opponent } = activity;
  const beatReader = opponent?.id === readerId && friend.outcome === "win";
  const wpm = (value: number) => numberFormat(locale).format(Math.round(value));

  return (
    <li className="gap-2 text-sm play-rows-slim:gap-1.5 play-rows-slim:text-xs">
      <UserAvatar
        handle={friend.handle}
        image={friend.image}
        size="sm"
        fallbackClassName="bg-surface-2 text-[10px] font-bold text-foreground"
      />
      <RowSentence>
        {withSlots(
          (marks) =>
            beatReader
              ? m.play_friends_beat_you(marks, { locale })
              : SENTENCES[friend.outcome](marks, { locale }),
          { friend: <RowHandle handle={friend.handle} /> },
        )}
      </RowSentence>
      {beatReader && opponent !== null ? (
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums play-rows-slim:hidden">
          {m.play_duel_wpm({ winnerWpm: wpm(friend.wpm), loserWpm: wpm(opponent.wpm) }, { locale })}
        </span>
      ) : null}
      {friend.tp === null ? null : (
        <span className={cn("shrink-0 text-xs font-bold tabular-nums", tpTone(friend.tp))}>
          {signedTp(friend.tp, locale)}
        </span>
      )}
      <time
        dateTime={new Date(activity.at).toISOString()}
        className="ml-auto shrink-0 text-xs text-muted-foreground play-rows-narrow:hidden"
      >
        {relativeTime(activity.at, now, locale, "short")}
      </time>
      {beatReader && friendOnline ? <RematchButton friend={friend} /> : null}
    </li>
  );
};

import type { Activity } from "@/api/activity";
import { ActivityRow } from "@/components/activity/activity-row";
import { HandleLink } from "@/components/handle/handle-link";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import { numberFormat } from "@/locale/formats";
import { withSlots } from "@/locale/message-slots";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type DuelActivity = Extract<Activity, { type: "duel" }>;

type DuelActivityItemProps = { activity: DuelActivity; now: number };

// What the Friend did to their opponent, by the Duel's outcome from their side.
const SENTENCES = {
  win: m.activity_duel_win,
  loss: m.activity_duel_loss,
  draw: m.activity_duel_draw,
} satisfies Record<DuelActivity["friend"]["outcome"], typeof m.activity_duel_win>;

// A Duel a Friend finished, against anyone: its outcome from the Friend's side, both wpm, and the
// Forfeit when there was one.
export const DuelActivityItem = ({ activity, now }: DuelActivityItemProps) => {
  const { friend, opponent } = activity;
  const locale = useLocale();
  const wpm = numberFormat(locale).format(Math.round(friend.wpm));

  return (
    <ActivityRow
      friend={friend}
      at={activity.at}
      now={now}
      meta={
        opponent
          ? m.activity_wpm_both(
              { wpm, opponentWpm: numberFormat(locale).format(Math.round(opponent.wpm)) },
              { locale },
            )
          : m.activity_wpm({ wpm }, { locale })
      }
    >
      {withSlots(
        (marks) =>
          SENTENCES[friend.outcome](
            { ...marks, forfeit: activity.forfeit ? "yes" : "no" },
            { locale },
          ),
        {
          friend: <HandleLink handle={friend.handle} className="font-semibold" />,
          opponent: <OpponentHandle opponent={opponent} className="font-semibold" />,
        },
      )}
    </ActivityRow>
  );
};

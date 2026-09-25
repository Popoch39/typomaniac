import type { Activity } from "@/api/activity";
import { ActivityRow } from "@/components/activity/activity-row";
import { HandleLink } from "@/components/handle/handle-link";
import { OpponentHandle } from "@/components/handle/opponent-handle";

type DuelActivity = Extract<Activity, { type: "duel" }>;

type DuelActivityItemProps = { activity: DuelActivity; now: number };

const VERBS: Record<DuelActivity["friend"]["outcome"], string> = {
  win: "a battu",
  loss: "a perdu contre",
  draw: "a fait match nul avec",
};

// A Duel a Friend finished, against anyone: its outcome from the Friend's side, both wpm, and the
// Forfeit when there was one.
export const DuelActivityItem = ({ activity, now }: DuelActivityItemProps) => {
  const { friend, opponent } = activity;

  return (
    <ActivityRow friend={friend} at={activity.at} now={now}>
      <HandleLink handle={friend.handle} className="font-semibold" /> {VERBS[friend.outcome]}{" "}
      <OpponentHandle opponent={opponent} className="font-semibold" />
      {activity.forfeit ? " par abandon" : null}
      <span className="block font-mono text-xs text-muted-foreground tabular-nums">
        {Math.round(friend.wpm)} wpm
        {opponent ? ` · ${Math.round(opponent.wpm)} wpm` : null}
      </span>
    </ActivityRow>
  );
};

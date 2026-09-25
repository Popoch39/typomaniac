import { t } from "elysia";

// A User as the Activity shows them: their Handle and their avatar, never their name nor email.
const activityUser = t.Object({
  id: t.String(),
  handle: t.String(),
  image: t.Nullable(t.String()),
});

// A player of a Duel of the Activity: their outcome seen from them, the Forfeit a loss.
const activityPlayer = t.Object({
  id: t.String(),
  handle: t.String(),
  image: t.Nullable(t.String()),
  wpm: t.Number(),
  outcome: t.UnionEnum(["win", "loss", "draw"]),
});

export const ActivityModel = {
  // The last Activities of the signed-in User's Friends of today, the newest first: `friend` is
  // one of them. A Duel's `opponent` is null once their User is deleted.
  activities: t.Array(
    t.Union([
      t.Object({
        type: t.Literal("duel"),
        id: t.String(),
        at: t.Number(),
        forfeit: t.Boolean(),
        friend: activityPlayer,
        opponent: t.Nullable(activityPlayer),
      }),
      t.Object({
        type: t.Literal("friendship"),
        id: t.String(),
        at: t.Number(),
        friend: activityUser,
        other: activityUser,
      }),
    ]),
  ),
};

export type Activities = typeof ActivityModel.activities.static;

export type Activity = Activities[number];

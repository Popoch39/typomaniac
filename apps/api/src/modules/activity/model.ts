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

// A Duel or a friendship, `friend` a Friend of the reader. A Duel's `opponent` is null once their
// User is deleted.
const activity = t.Union([
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
]);

// A Friend who just came online, from offline: shown on the moment, never kept nor read back.
const arrival = t.Object({ id: t.String(), at: t.Number(), friend: activityUser });

// What the real-time connection tells a User of their Friends' Activity, on the Duel socket (ADR
// 0007): one Activity just happened, to put first. An ended friendship is told by `friend-removed`.
const activityMessage = t.Object({ type: t.Literal("activity-added"), activity });

// A Friend's arrival, on the same socket: apart from the Activities, since the read never has it.
const arrivalMessage = t.Object({ type: t.Literal("friend-arrived"), arrival });

export const ActivityModel = {
  // The last Activities of the signed-in User's Friends of today, the newest first.
  activities: t.Array(activity),
  activityMessage,
  arrivalMessage,
};

export type Activities = typeof ActivityModel.activities.static;

export type Activity = Activities[number];

export type ActivityMessage = typeof activityMessage.static;

export type ArrivalMessage = typeof arrivalMessage.static;

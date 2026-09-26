import { t } from "elysia";

import { DuelModel } from "../duel/model";

// The aggregates of a User's finished Duels (Runs never count): their record, their averages and
// their bests. The averages and the best wpm are null without a Duel; the best Score and Combo
// also without a Duel played since the Score.
const stats = t.Object({
  duels: t.Integer(),
  record: t.Object({ wins: t.Integer(), losses: t.Integer(), draws: t.Integer() }),
  averages: t.Object({ wpm: t.Nullable(t.Number()), accuracy: t.Nullable(t.Number()) }),
  records: t.Object({
    wpm: t.Nullable(t.Number()),
    score: t.Nullable(t.Integer()),
    combo: t.Nullable(t.Integer()),
  }),
  // The Progression: the Duels of the window but the Forfeits, the oldest first.
  progression: t.Array(
    t.Object({
      endedAt: t.Number(),
      wpm: t.Number(),
      raw: t.Number(),
      accuracy: t.Number(),
      consistency: t.Number(),
    }),
  ),
});

// How many of their last Duels (Forfeits left out) the Progression shows.
export const PROGRESSION_WINDOWS = ["50", "200", "all"] as const;

export const ProfileModel = {
  params: t.Object({ handle: t.String({ maxLength: 100 }) }),
  query: t.Object({ window: t.Optional(t.UnionEnum(PROGRESSION_WINDOWS)) }),
  // A User's Profile: their Handle of today, their avatar and their Stats, never their name nor
  // their email.
  // Their rank is null until they first join the Queue; their Ornament, resolved by the server
  // (never their raw choice), is null in Placement too.
  profile: t.Object({
    handle: t.String(),
    image: t.Nullable(t.String()),
    rank: t.Nullable(DuelModel.rank),
    ornament: t.Nullable(DuelModel.tier),
    stats,
  }),
};

export type Profile = typeof ProfileModel.profile.static;

export type ProgressionWindow = (typeof PROGRESSION_WINDOWS)[number];

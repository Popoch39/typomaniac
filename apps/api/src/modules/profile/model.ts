import { t } from "elysia";

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
});

export const ProfileModel = {
  params: t.Object({ handle: t.String({ maxLength: 100 }) }),
  // A User's Profile: their Handle of today, their avatar and their Stats, never their name nor
  // their email.
  profile: t.Object({ handle: t.String(), image: t.Nullable(t.String()), stats }),
};

export type Profile = typeof ProfileModel.profile.static;

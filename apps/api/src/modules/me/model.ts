import { t } from "elysia";

import { ORNAMENT_CHOICES } from "ranked";

import { DuelModel } from "../duel/model";

// The Ornament a User chooses (ranked package): their Tier's, a Tier frozen, or none. Without a
// default, which UnionEnum otherwise takes from its first value: a body without a choice is refused.
const ornamentChoice = t.UnionEnum(ORNAMENT_CHOICES, { default: undefined });

export const MeModel = {
  me: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    image: t.Nullable(t.String()),
    // Null until the User chooses it: the front asks for it.
    handle: t.Nullable(t.String()),
    // Their rank, never their MMR: null until they first join the Queue.
    rank: t.Nullable(DuelModel.rank),
    // The Ornament they wear, resolved from their choice: null in Placement or without a Rating.
    ornament: t.Nullable(DuelModel.tier),
    // Their raw choice, theirs alone, for the Profile's picker: null without a Rating.
    ornamentChoice: t.Nullable(ornamentChoice),
  }),
  ornamentInput: t.Object({ choice: ornamentChoice }),
  // In wpm: the median wpm of the User's last Duels, or the default Pace without any.
  pace: t.Object({ pace: t.Number() }),
};

export type Me = typeof MeModel.me.static;

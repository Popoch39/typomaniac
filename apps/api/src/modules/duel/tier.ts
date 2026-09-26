import { t } from "elysia";
import { TIERS } from "ranked";

// A Tier of the ranked package, Maniac included. Apart from model.ts: the models of the Friends and
// of the Activity, which model.ts gathers into its messages, import it without a cycle.
export const Tier = t.UnionEnum(TIERS);

// The Ornament a User wears, resolved by the server (never their raw choice): null in Placement,
// without a Rating or by choice.
export const WornOrnament = t.Nullable(Tier);

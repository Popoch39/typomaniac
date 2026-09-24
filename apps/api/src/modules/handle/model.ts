import { t } from "elysia";

import { HANDLE_UNAVAILABLE } from "./service";

// Any length: a Handle too long is refused as `too-long`, with the other reasons.
const handleInput = t.Object({ handle: t.String() });

export const HandleModel = {
  input: handleInput,
  availability: t.Union([
    t.Object({ available: t.Literal(true), handle: t.String() }),
    t.Object({ available: t.Literal(false), reason: t.UnionEnum(HANDLE_UNAVAILABLE) }),
  ]),
};

export type HandleInput = typeof HandleModel.input.static;

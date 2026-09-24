import { isHandlePrefix } from "handle";

import { ApiError } from "../../lib/errors";
import type { HandleMatch, Users } from "./users";

export const SEARCH_LIMIT = 10;

// Where the searching User stands with a User found. Always `none` until the Friends exist.
export const RELATIONS = ["none"] as const;

export type Relation = (typeof RELATIONS)[number];

export type UserFound = HandleMatch & { relation: Relation };

// The Users whose Handle starts with `input`, whatever its case: the exact Handle first, then the
// others in alphabetical order, never the searcher nor a User without a Handle. The searching User
// needs a Handle of their own: without a public name, they have no business finding others.
export const searchUsers = async (
  users: Users,
  searcher: { id: string; handle: string | null },
  input: string,
): Promise<UserFound[]> => {
  if (searcher.handle === null) {
    throw new ApiError("FORBIDDEN", "Choose a Handle to search Users");
  }

  const prefix = input.toLowerCase();

  if (!isHandlePrefix(prefix)) {
    return [];
  }

  const matches = await users.searchHandles(prefix, {
    excluding: searcher.id,
    limit: SEARCH_LIMIT,
  });

  return matches.map(({ id, handle, image }) => ({ id, handle, image, relation: "none" }));
};

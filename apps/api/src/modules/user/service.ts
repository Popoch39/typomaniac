import { isHandlePrefix } from "handle";

import { ApiError } from "../../lib/errors";
import type { Relation } from "../friend/model";
import { relationsWith } from "../friend/service";
import type { FriendStore } from "../friend/store";
import type { HandleMatch, Users } from "./users";

export const SEARCH_LIMIT = 10;

export type UserFound = HandleMatch & { relation: Relation };

// The Users whose Handle starts with `input`, whatever its case: the exact Handle first, then the
// others in alphabetical order, never the searcher nor a User without a Handle. Each with where the
// searcher stands with them. The searching User needs a Handle of their own: without a public name,
// they have no business finding others.
export const searchUsers = async (
  { users, friendStore }: { users: Users; friendStore: FriendStore },
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

  const relationOf = await relationsWith(
    friendStore,
    searcher.id,
    matches.map((match) => match.id),
  );

  return matches.map(({ id, handle, image }) => ({ id, handle, image, relation: relationOf(id) }));
};

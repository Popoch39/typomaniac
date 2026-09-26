import { isHandlePrefix } from "handle";

import { ApiError } from "../../lib/errors";
import { type DuelStore, readOrnaments } from "../duel/store";
import { relationsWith } from "../friend/service";
import type { FriendStore } from "../friend/store";
import type { UsersFound } from "./model";
import { withOrnaments } from "./public-users";
import type { Users } from "./users";

export const SEARCH_LIMIT = 10;

export type UserFound = UsersFound[number];

// The Users whose Handle starts with `input`, whatever its case: the exact Handle first, then the
// others in alphabetical order, never the searcher nor a User without a Handle. Each with their
// Ornament and where the searcher stands with them. The searching User needs a Handle of their
// own: without a public name, they have no business finding others.
export const searchUsers = async (
  {
    users,
    friendStore,
    duelStore,
  }: { users: Users; friendStore: FriendStore; duelStore: DuelStore },
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

  const ids = matches.map((match) => match.id);

  const [relationOf, ornaments] = await Promise.all([
    relationsWith(friendStore, searcher.id, ids),
    readOrnaments(duelStore, ids),
  ]);

  return withOrnaments(matches, ornaments).map(({ id, handle, image, ornament }) => ({
    id,
    handle,
    image,
    ornament,
    relation: relationOf(id),
  }));
};

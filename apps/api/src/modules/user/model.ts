import { t } from "elysia";
import { HANDLE_SEARCH_MIN_LENGTH } from "handle";

import { FriendModel } from "../friend/model";

export const UserModel = {
  searchQuery: t.Object({ handle: t.String({ minLength: HANDLE_SEARCH_MIN_LENGTH }) }),
  // Never the name nor the email of a User found: their Handle and their avatar.
  usersFound: t.Array(
    t.Object({
      id: t.String(),
      handle: t.String(),
      image: t.Nullable(t.String()),
      relation: FriendModel.relation,
    }),
  ),
};

export type UsersFound = typeof UserModel.usersFound.static;

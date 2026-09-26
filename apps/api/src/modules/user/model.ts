import { t } from "elysia";
import { HANDLE_SEARCH_MIN_LENGTH } from "handle";

import { FriendModel } from "../friend/model";
import { PublicUser } from "./public-user";

export const UserModel = {
  searchQuery: t.Object({ handle: t.String({ minLength: HANDLE_SEARCH_MIN_LENGTH }) }),
  // Never the name nor the email of a User found: their Handle, their avatar and the Ornament they
  // wear around it.
  usersFound: t.Array(
    t.Object({
      ...PublicUser.properties,
      relation: FriendModel.relation,
    }),
  ),
};

export type UsersFound = typeof UserModel.usersFound.static;

import { Elysia } from "elysia";

import { keyedRateLimit, type RateLimit } from "../../plugins/rate-limit";
import { type AuthHandler, authentication } from "../auth";
import type { FriendStore } from "../friend/store";
import { UserModel } from "./model";
import { searchUsers } from "./service";
import type { Users } from "./users";

export type UserModuleConfig = {
  auth: AuthHandler;
  trustProxy: boolean;
  users: Users;
  // Where the searcher stands with each User found.
  friendStore: FriendStore;
  // Per User, stricter than the global limit: the search must not dump the Handles.
  searchRateLimit: RateLimit;
};

export const userModule = ({
  auth,
  trustProxy,
  users,
  friendStore,
  searchRateLimit,
}: UserModuleConfig) => {
  // Throws the 429 once a User is over their searches.
  const limitSearches = keyedRateLimit(searchRateLimit);

  return (
    new Elysia({ name: "user", seed: users })
      .use(authentication(auth, { trustProxy }))
      // Updated as the User types: the Users whose Handle starts with `handle`, at most 10.
      .get(
        "/users/search",
        ({ user, query, set }) => {
          limitSearches(user.id, set);

          return searchUsers(
            { users, friendStore },
            { id: user.id, handle: user.handle ?? null },
            query.handle,
          );
        },
        {
          auth: true,
          query: UserModel.searchQuery,
          response: UserModel.usersFound,
          detail: { summary: "Finds Users by the start of their Handle", tags: ["Friends"] },
        },
      )
  );
};

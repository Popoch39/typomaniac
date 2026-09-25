import { ApiError } from "../../lib/errors";
import type { DuelStore } from "../duel/store";
import type { Users } from "../user/users";
import type { Profile } from "./model";

export type ProfileDeps = { store: DuelStore; users: Users };

// The Profile of the User who holds `handle` today, whatever its case: a Handle given up finds
// nobody.
export const profileOfHandle = async (
  { store, users }: ProfileDeps,
  handle: string,
): Promise<Profile> => {
  const userId = await users.idOfHandle(handle.toLowerCase());

  const profile = userId === null ? null : await users.profileOf(userId);

  if (userId === null || profile?.handle == null) {
    throw new ApiError("NOT_FOUND", "User not found");
  }

  return { handle: profile.handle, image: profile.image, stats: await store.stats(userId) };
};

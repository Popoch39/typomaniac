import type { AuthContext } from "better-auth";

import { avatarOf, type PhotoUrl } from "../photo/avatar";

// What the other Users see of a User: their Handle (null until chosen) and their Avatar, never
// their name nor their email.
export type PublicProfile = { handle: string | null; image: string | null };

// A User found by their Handle: what the search shows of them.
export type HandleMatch = { id: string; handle: string; image: string | null };

type SearchOptions = { excluding: string; limit: number };

// A User the search found, as the database holds them: their provider's image and their Photo
// apart, the Users make the Avatar of them.
export type HandleRow = { id: string; handle: string; image: string | null; photo: string | null };

// The Users whose Handle starts with `prefix`, already lowercased and taken literally (an `_` is
// an underscore), ordered by Handle (the exact one first), `excluding` left out, at most `limit`.
export type HandleSearch = (prefix: string, options: SearchOptions) => Promise<HandleRow[]>;

// The Users as the app reads and writes them past the Session, which may be a few minutes old
// (cookie cache). Injected through AppConfig: Better Auth's database in production and in the
// tests, a test may wrap it to force a race. Every `image` is the Avatar (photo/avatar.ts).
export type Users = {
  profileOf: (userId: string) => Promise<PublicProfile | null>;
  // Those of `userIds` who have a Handle, in no given order: the Friends, the Friend requests.
  profilesOf: (userIds: readonly string[]) => Promise<HandleMatch[]>;
  // The id of the User who holds this Handle, already lowercased, if any.
  idOfHandle: (handle: string) => Promise<string | null>;
  // Refused by the database's unique constraint when another User holds it.
  setHandle: (userId: string, handle: string) => Promise<void>;
  searchHandles: (prefix: string, options: SearchOptions) => Promise<HandleMatch[]>;
  // The key of the User's Photo in the PhotoStore, null without one.
  photoOf: (userId: string) => Promise<string | null>;
  setPhoto: (userId: string, key: string | null) => Promise<void>;
};

export type UserRow = {
  id: string;
  handle?: string | null;
  image?: string | null;
  photo?: string | null;
};

// Only what the Users read and write: the rest of the context depends on the auth's options.
// `findMany` for the tests' Handle search.
export type UsersContext = {
  adapter: Pick<AuthContext["adapter"], "findOne" | "findMany">;
  internalAdapter: Pick<AuthContext["internalAdapter"], "updateUser">;
};

// On Better Auth's adapter: the same code on Drizzle and on the memory adapter of the tests. Except
// the search: the adapter's `starts_with` is a SQL `LIKE` that takes `_` as a wildcard, so each
// database brings its own (drizzle-handle-search.ts, memoryHandleSearch in the tests).
export const authUsers = (
  auth: { $context: Promise<UsersContext> },
  { searchHandles, photoUrl }: { searchHandles: HandleSearch; photoUrl: PhotoUrl },
): Users => {
  const findOne = async (field: "id" | "handle", value: string) => {
    const { adapter } = await auth.$context;

    return adapter.findOne<UserRow>({ model: "user", where: [{ field, value }] });
  };

  const update = async (userId: string, fields: Partial<UserRow>) => {
    const { internalAdapter } = await auth.$context;

    await internalAdapter.updateUser(userId, fields);
  };

  return {
    profileOf: async (userId) => {
      const row = await findOne("id", userId);

      return row ? { handle: row.handle ?? null, image: avatarOf(photoUrl, row) } : null;
    },
    profilesOf: async (userIds) => {
      if (userIds.length === 0) {
        return [];
      }

      const { adapter } = await auth.$context;

      const rows = await adapter.findMany<UserRow>({
        model: "user",
        where: [{ field: "id", operator: "in", value: [...userIds] }],
        limit: userIds.length,
      });

      return rows.flatMap((row) =>
        row.handle ? [{ id: row.id, handle: row.handle, image: avatarOf(photoUrl, row) }] : [],
      );
    },
    idOfHandle: async (handle) => (await findOne("handle", handle))?.id ?? null,
    setHandle: (userId, handle) => update(userId, { handle }),
    searchHandles: async (prefix, options) =>
      (await searchHandles(prefix, options)).map((row) => ({
        id: row.id,
        handle: row.handle,
        image: avatarOf(photoUrl, row),
      })),
    photoOf: async (userId) => (await findOne("id", userId))?.photo ?? null,
    setPhoto: (userId, photo) => update(userId, { photo }),
  };
};

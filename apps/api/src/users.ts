import type { AuthContext } from "better-auth";

// What the other Users see of a User: their Handle (null until chosen) and their avatar, never
// their name nor their email.
export type PublicProfile = { handle: string | null; image: string | null };

// The Users as the app reads and writes them past the Session, which may be a few minutes old
// (cookie cache). Injected through AppConfig: Better Auth's database in production and in the
// tests, a test may wrap it to force a race.
export type Users = {
  profileOf: (userId: string) => Promise<PublicProfile | null>;
  // The id of the User who holds this Handle, already lowercased, if any.
  idOfHandle: (handle: string) => Promise<string | null>;
  // Refused by the database's unique constraint when another User holds it.
  setHandle: (userId: string, handle: string) => Promise<void>;
};

type UserRow = { id: string; handle?: string | null; image?: string | null };

// Only what the Users read and write: the rest of the context depends on the auth's options.
export type UsersContext = {
  adapter: Pick<AuthContext["adapter"], "findOne">;
  internalAdapter: Pick<AuthContext["internalAdapter"], "updateUser">;
};

// On Better Auth's adapter: the same code on Drizzle and on the memory adapter of the tests.
export const authUsers = (auth: { $context: Promise<UsersContext> }): Users => {
  const findOne = async (field: "id" | "handle", value: string) => {
    const { adapter } = await auth.$context;

    return adapter.findOne<UserRow>({ model: "user", where: [{ field, value }] });
  };

  return {
    profileOf: async (userId) => {
      const row = await findOne("id", userId);

      return row ? { handle: row.handle ?? null, image: row.image ?? null } : null;
    },
    idOfHandle: async (handle) => (await findOne("handle", handle))?.id ?? null,
    setHandle: async (userId, handle) => {
      const { internalAdapter } = await auth.$context;

      await internalAdapter.updateUser(userId, { handle });
    },
  };
};

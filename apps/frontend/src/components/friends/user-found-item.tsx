import type { UserFound } from "@/api/user-search";
import { RelationActions } from "@/components/friends/relation-actions";
import { UserRow } from "@/components/friends/user-row";

type UserFoundItemProps = {
  user: UserFound;
};

// A User found by their Handle, with what the searcher can do with them.
export const UserFoundItem = ({ user }: UserFoundItemProps) => (
  <UserRow user={user}>
    <RelationActions user={user} />
  </UserRow>
);
